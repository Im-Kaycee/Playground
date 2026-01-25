# routes/openapi.py
from fastapi import APIRouter, Depends, HTTPException
import httpx
from urllib.parse import urlparse
from App.auth.auth import get_current_user
from App.models.models import User

router = APIRouter(prefix="/api", tags=["openapi"])

@router.post("/load-openapi")
async def load_openapi(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    spec_url = payload.get("spec_url")
    
    if not spec_url:
        raise HTTPException(status_code=400, detail="spec_url is required")
    
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            res = await client.get(spec_url)
            
            if res.status_code != 200:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to fetch spec: HTTP {res.status_code}"
                )
            
            # Check content type
            content_type = res.headers.get("content-type", "").lower()
            
            # Try to parse as JSON
            try:
                spec = res.json()
            except Exception as json_err:
                # Check if it's HTML
                if "text/html" in content_type or res.text.strip().startswith("<!DOCTYPE") or res.text.strip().startswith("<html"):
                    raise HTTPException(
                        status_code=400,
                        detail="URL returned HTML instead of JSON. Make sure you're using the direct spec URL (e.g., /openapi.json or /swagger.json), not the docs page URL."
                    )
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid JSON response. Content-Type: {content_type}. Error: {str(json_err)}"
                )
            
            # Validate it's an OpenAPI spec
            if "openapi" not in spec and "swagger" not in spec:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid OpenAPI spec: missing 'openapi' or 'swagger' field. This doesn't appear to be a valid OpenAPI specification."
                )
            
            # Parse endpoints
            endpoints = []
            base_url = ""
            
            # Get base URL from servers
            servers = spec.get("servers", [])
            if servers and len(servers) > 0:
                server_url = servers[0].get("url", "")
                if server_url:
                    base_url = server_url.rstrip('/')
            
            # If no base_url from servers, try to extract from spec_url
            if not base_url:
                parsed = urlparse(spec_url)
                base_url = f"{parsed.scheme}://{parsed.netloc}"
            
            # Parse paths
            paths = spec.get("paths", {})
            
            if not paths:
                raise HTTPException(
                    status_code=400,
                    detail="No paths found in OpenAPI spec"
                )
            
            for path, methods in paths.items():
                for method, details in methods.items():
                    method_upper = method.upper()
                    if method_upper in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                        
                        # Extract request body examples
                        request_body_example = None
                        examples_list = []
                        
                        request_body = details.get("requestBody", {})
                        if request_body:
                            content = request_body.get("content", {})
                            json_content = content.get("application/json", {})
                            schema = json_content.get("schema", {})
                            
                            # Extract multiple examples if present (OpenAPI 3.0 format)
                            examples = json_content.get("examples", {})
                            if examples and isinstance(examples, dict):
                                for example_name, example_data in examples.items():
                                    if isinstance(example_data, dict):
                                        examples_list.append({
                                            "name": example_data.get("summary") or example_data.get("name") or example_name,
                                            "description": example_data.get("description", ""),
                                            "value": example_data.get("value"),
                                        })
                            
                            # Single example (older format)
                            single_example = json_content.get("example")
                            if single_example and not examples_list:
                                request_body_example = single_example
                            elif examples_list and len(examples_list) > 0:
                                # Use first example as default
                                request_body_example = examples_list[0].get("value")
                            elif not examples_list and not single_example:
                                # Generate from schema if no examples (resolve $ref first)
                                resolved_schema = resolve_schema_ref(schema, spec)
                                request_body_example = generate_example_from_schema(resolved_schema)
                        
                        # Extract parameters
                        parameters = details.get("parameters", [])
                        
                        # Build full URL
                        full_url = f"{base_url}{path}" if base_url else path
                        
                        endpoint = {
                            "method": method_upper,
                            "path": path,
                            "url": full_url,
                            "summary": details.get("summary", ""),
                            "description": details.get("description", ""),
                            "parameters": parameters,
                            "requestBodyExample": request_body_example,
                            "examples": examples_list,
                            "tags": details.get("tags", []),
                        }
                        endpoints.append(endpoint)
            
            return {
                "spec": spec,
                "endpoints": endpoints,
                "info": spec.get("info", {}),
                "servers": servers,
                "version": spec.get("openapi") or spec.get("swagger"),
            }
    
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=400, 
            detail="Request timeout. The spec URL took too long to respond."
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Network error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error parsing spec: {str(e)}"
        )


def resolve_schema_ref(schema, spec):
    """Resolve $ref in schema to actual schema definition"""
    if not isinstance(schema, dict):
        return schema
    
    if "$ref" in schema:
        ref = schema["$ref"]
        # $ref format: "#/components/schemas/SchemaName"
        parts = ref.split("/")
        if len(parts) >= 4 and parts[0] == "#":
            schema_name = parts[-1]
            return spec.get("components", {}).get("schemas", {}).get(schema_name, {})
    
    return schema


def generate_example_from_schema(schema):
    """Generate a simple example from a JSON schema"""
    if not schema or not isinstance(schema, dict):
        return None
    
    # Handle $ref (shouldn't happen if resolved, but just in case)
    if "$ref" in schema:
        return None
    
    # Handle arrays
    if schema.get("type") == "array":
        items = schema.get("items", {})
        item_example = generate_example_from_schema(items)
        return [item_example] if item_example else []
    
    # Handle objects
    properties = schema.get("properties", {})
    if not properties:
        return None
    
    example = {}
    required_fields = schema.get("required", [])
    
    for key, value in properties.items():
        # Skip read-only fields
        if value.get("readOnly"):
            continue
            
        # Check if field has an example
        if "example" in value:
            example[key] = value["example"]
            continue
        
        # Check if field has a default
        if "default" in value:
            example[key] = value["default"]
            continue
        
        # Generate based on type
        prop_type = value.get("type")
        
        if prop_type == "string":
            # Check for format hints
            prop_format = value.get("format")
            prop_enum = value.get("enum")
            
            if prop_enum:
                example[key] = prop_enum[0]  # Use first enum value
            elif prop_format == "email":
                example[key] = "user@example.com"
            elif prop_format == "password":
                example[key] = "password123"
            elif prop_format == "date":
                example[key] = "2024-01-01"
            elif prop_format == "date-time":
                example[key] = "2024-01-01T00:00:00Z"
            elif prop_format == "uri":
                example[key] = "https://example.com"
            elif "username" in key.lower():
                example[key] = "username"
            elif "name" in key.lower():
                example[key] = "Example Name"
            else:
                max_length = value.get("maxLength", 50)
                example[key] = "string" if max_length > 10 else "str"
        elif prop_type == "number":
            example[key] = 0.0
        elif prop_type == "integer":
            example[key] = 0
        elif prop_type == "boolean":
            example[key] = True
        elif prop_type == "array":
            items = value.get("items", {})
            item_example = generate_example_from_schema(items)
            example[key] = [item_example] if item_example else []
        elif prop_type == "object":
            nested = generate_example_from_schema(value)
            example[key] = nested if nested else {}
    
    return example if example else None