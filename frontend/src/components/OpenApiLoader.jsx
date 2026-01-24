import { useState, useEffect } from "react";
import { Loader2, FileText, Play, Search, RefreshCw, X, ChevronDown, ChevronUp } from "lucide-react";

function OpenAPILoader({ onLoadEndpoint }) {
  const [specUrl, setSpecUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [endpoints, setEndpoints] = useState([]);
  const [apiInfo, setApiInfo] = useState(null);
  const [lastLoaded, setLastLoaded] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState({});

  useEffect(() => {
    // Load from sessionStorage on mount
    const savedEndpoints = sessionStorage.getItem('openapi_endpoints');
    const savedInfo = sessionStorage.getItem('openapi_info');
    const savedUrl = sessionStorage.getItem('openapi_url');
    const savedTime = sessionStorage.getItem('openapi_loaded_at');
    
    if (savedEndpoints) {
      try {
        setEndpoints(JSON.parse(savedEndpoints));
        setApiInfo(JSON.parse(savedInfo));
        setSpecUrl(savedUrl);
        setLastLoaded(new Date(savedTime));
      } catch (err) {
        console.error("Failed to load saved spec:", err);
      }
    }
  }, []);

  async function loadSpec(isRefresh = false) {
    if (!specUrl) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/load-openapi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ spec_url: specUrl }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load spec");
      }
      
      setEndpoints(data.endpoints);
      setApiInfo(data.info);
      
      const now = new Date();
      setLastLoaded(now);
      
      // Save to sessionStorage
      sessionStorage.setItem('openapi_endpoints', JSON.stringify(data.endpoints));
      sessionStorage.setItem('openapi_info', JSON.stringify(data.info));
      sessionStorage.setItem('openapi_url', specUrl);
      sessionStorage.setItem('openapi_loaded_at', now.toISOString());
      
      if (isRefresh) {
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function clearSpec() {
    setEndpoints([]);
    setApiInfo(null);
    setSpecUrl("");
    setLastLoaded(null);
    setError(null);
    setExpandedEndpoints({});
    sessionStorage.removeItem('openapi_endpoints');
    sessionStorage.removeItem('openapi_info');
    sessionStorage.removeItem('openapi_url');
    sessionStorage.removeItem('openapi_loaded_at');
  }

  function toggleEndpoint(idx) {
    setExpandedEndpoints(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  }

  const filteredEndpoints = endpoints.filter(e => 
    e.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMethodColor = (method) => {
    const colors = {
      GET: "bg-blue-600",
      POST: "bg-green-600",
      PUT: "bg-yellow-600",
      DELETE: "bg-red-600",
      PATCH: "bg-purple-600",
    };
    return colors[method] || "bg-neutral-600";
  };

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div className="bg-neutral-950 rounded border border-neutral-800">
        <div className="border-b border-neutral-800 px-6 py-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Load OpenAPI Specification
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              OpenAPI Spec URL
            </label>
            <div className="flex gap-2">
              <input
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                disabled={endpoints.length > 0}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {endpoints.length === 0 ? (
                <button
                  onClick={() => loadSpec(false)}
                  disabled={loading || !specUrl}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Load Spec
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => loadSpec(true)}
                    disabled={refreshing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                    title="Refresh to get latest endpoints"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearSpec}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                </>
              )}
            </div>
            
            {lastLoaded && (
              <p className="text-xs text-neutral-500 mt-2">
                Last loaded: {lastLoaded.toLocaleString()}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded p-4">
              <p className="text-red-400 text-sm font-medium">Failed to load spec</p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
          )}

          {apiInfo && (
            <div className="bg-neutral-900 rounded p-4 border border-neutral-800">
              <h3 className="text-white font-semibold">{apiInfo.title}</h3>
              {apiInfo.description && (
                <p className="text-neutral-400 text-sm mt-1">{apiInfo.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                {apiInfo.version && <span>Version: {apiInfo.version}</span>}
                <span className="text-neutral-600">•</span>
                <span>{endpoints.length} endpoints</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Endpoints List */}
      {endpoints.length > 0 && (
        <div className="bg-neutral-950 rounded border border-neutral-800">
          <div className="border-b border-neutral-800 px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Available Endpoints ({filteredEndpoints.length})
              </h2>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search endpoints..."
                  className="pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 w-64"
                />
              </div>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredEndpoints.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-neutral-500 text-sm">No endpoints match your search</p>
              </div>
            ) : (
              filteredEndpoints.map((endpoint, idx) => (
                <div
                  key={idx}
                  className="border-b border-neutral-800 last:border-b-0"
                >
                  <div 
                    className="px-6 py-4 hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleEndpoint(idx)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold text-white ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <span className="text-white text-sm font-mono">
                            {endpoint.url}
                          </span>
                          {endpoint.examples && endpoint.examples.length > 0 && (
                            <span className="px-2 py-0.5 bg-green-900 text-green-400 text-xs rounded">
                              {endpoint.examples.length} example{endpoint.examples.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {expandedEndpoints[idx] ? (
                            <ChevronUp className="w-4 h-4 text-neutral-500 ml-auto" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-500 ml-auto" />
                          )}
                        </div>
                        {endpoint.summary && (
                          <p className="text-neutral-400 text-sm mb-2">{endpoint.summary}</p>
                        )}
                        {endpoint.description && !endpoint.summary && (
                          <p className="text-neutral-400 text-sm mb-2 line-clamp-2">{endpoint.description}</p>
                        )}
                        {endpoint.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {endpoint.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedEndpoints[idx] && (
                      <div className="mt-4 space-y-3">
                        {/* Parameters */}
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div className="bg-neutral-900 rounded p-3 border border-neutral-800">
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                              Parameters
                            </h4>
                            <div className="space-y-2">
                              {endpoint.parameters.map((param, i) => (
                                <div key={i} className="text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-white">{param.name}</span>
                                    <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded text-[10px]">
                                      {param.in}
                                    </span>
                                    {param.required && (
                                      <span className="px-1.5 py-0.5 bg-red-900 text-red-400 rounded text-[10px]">
                                        required
                                      </span>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className="text-neutral-500 mt-1">{param.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Request Body Example */}
                        {endpoint.requestBodyExample && (
                          <div className="bg-neutral-900 rounded p-3 border border-neutral-800">
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                              Request Body Example
                            </h4>
                            <pre className="text-xs text-neutral-300 font-mono overflow-x-auto">
                              {JSON.stringify(endpoint.requestBodyExample, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Multiple Examples */}
                        {endpoint.examples && endpoint.examples.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                              Examples
                            </h4>
                            {endpoint.examples.map((example, i) => (
                              <div key={i} className="bg-neutral-900 rounded border border-neutral-800">
                                <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
                                  <span className="text-xs font-medium text-white">
                                    {example.name || `Example ${i + 1}`}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onLoadEndpoint(endpoint, example);
                                    }}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    Try
                                  </button>
                                </div>
                                <div className="p-3">
                                  {example.description && (
                                    <p className="text-xs text-neutral-400 mb-2">{example.description}</p>
                                  )}
                                  {example.value && (
                                    <pre className="text-xs text-neutral-300 font-mono overflow-x-auto">
                                      {JSON.stringify(example.value, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Try This Endpoint Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadEndpoint(endpoint);
                          }}
                          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Try This Endpoint
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {endpoints.length === 0 && !loading && !error && (
        <div className="bg-neutral-950 rounded border border-neutral-800 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
            <FileText className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">No OpenAPI Spec Loaded</h3>
          <p className="text-neutral-500 text-sm">
            Enter your OpenAPI specification URL above to browse and test endpoints
          </p>
        </div>
      )}
    </div>
  );
}

export default OpenAPILoader;