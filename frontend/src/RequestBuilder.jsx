import { useState, useEffect } from "react";
import { 
  Send, Loader2, AlertCircle, CheckCircle2, Clock, Code, LogOut, 
  History, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Play, Trash2, X 
} from "lucide-react";
import RateLimitTest from "./components/RateLimitTest";
import OpenAPILoader from "./components/OpenApiLoader";
function RequestBuilder({ onLogout }) {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("body");
  const [responseTab, setResponseTab] = useState("body");
  const [logs, setLogs] = useState([]);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("request"); 

  // Auth state
  const [authType, setAuthType] = useState("none");
  const [bearerToken, setBearerToken] = useState("");
  
  // Headers as array of key-value pairs
  const [headersList, setHeadersList] = useState([{ key: "", value: "", enabled: true }]);
  
  // Saved requests state
  const [savedRequests, setSavedRequests] = useState([]);
  const [savedExpanded, setSavedExpanded] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Helper functions for headers
  const addHeader = () => {
    setHeadersList([...headersList, { key: "", value: "", enabled: true }]);
  };
  
  const removeHeader = (index) => {
    setHeadersList(headersList.filter((_, i) => i !== index));
  };
  
  const updateHeader = (index, field, value) => {
    const updated = [...headersList];
    updated[index][field] = value;
    setHeadersList(updated);
  };

  // Fetch logs
  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/proxy/logs", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.slice(0, 20));
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }

  // Fetch saved requests
  async function fetchSavedRequests() {
    setSavedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/proxy/saved", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSavedRequests(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved requests:", err);
    } finally {
      setSavedLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    fetchSavedRequests();
  }, []);

  // Save request (with or without name)
  async function saveRequest(customName = null) {
    try {
      const token = localStorage.getItem("token");
      
      // Build headers object from headersList and auth
      const headersObj = {};
      headersList.forEach(h => {
        if (h.enabled && h.key.trim()) {
          headersObj[h.key.trim()] = h.value;
        }
      });
      
      // Add auth header if applicable
      if (authType === "bearer" && bearerToken.trim()) {
        headersObj["Authorization"] = `Bearer ${bearerToken.trim()}`;
      }
      
      const parsedBody = body ? JSON.parse(body) : null;

      const payload = {
        method,
        url,
        headers: headersObj,
        body: parsedBody,
      };

      if (customName) {
        payload.name = customName;
      }

      const res = await fetch("http://localhost:8000/api/proxy/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSavedRequests();
        setShowSaveModal(false);
        setSaveName("");
      }
    } catch (err) {
      console.error("Failed to save request:", err);
    }
  }
 function handleLoadEndpoint(endpoint, example = null) {
  setMethod(endpoint.method);
  setUrl(endpoint.url);
  
  // If a specific example was clicked, use that
  if (example && example.value) {
    setBody(JSON.stringify(example.value, null, 2));
  } 
  // Otherwise use the default example
  else if (endpoint.requestBodyExample) {
    setBody(JSON.stringify(endpoint.requestBodyExample, null, 2));
  } 
  // Or use the first example from the list
  else if (endpoint.examples && endpoint.examples.length > 0 && endpoint.examples[0].value) {
    setBody(JSON.stringify(endpoint.examples[0].value, null, 2));
  } 
  else {
    setBody("");
  }
  
  // Switch to request tab so user can see what was loaded
  setActiveMainTab("request");
}
  // Load saved request
  function loadRequest(savedReq) {
    setMethod(savedReq.method);
    setUrl(savedReq.url);
    
    // Parse headers into list format
    const loadedHeaders = savedReq.headers || {};
    const headerPairs = Object.entries(loadedHeaders).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }));
    
    // Check if Authorization header exists and extract bearer token
    const authHeader = loadedHeaders["Authorization"] || loadedHeaders["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      setAuthType("bearer");
      setBearerToken(authHeader.substring(7));
      // Remove Authorization from headersList
      setHeadersList(headerPairs.filter(h => 
        h.key.toLowerCase() !== "authorization"
      ).concat({ key: "", value: "", enabled: true }));
    } else {
      setAuthType("none");
      setBearerToken("");
      setHeadersList(headerPairs.length > 0 ? headerPairs : [{ key: "", value: "", enabled: true }]);
    }
    
    setBody(savedReq.body ? JSON.stringify(savedReq.body, null, 2) : "");
  }

  // Delete saved request
  async function deleteRequest(id) {
    if (!confirm("Delete this saved request?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/proxy/saved/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchSavedRequests();
      }
    } catch (err) {
      console.error("Failed to delete request:", err);
    }
  }

  async function sendRequest() {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Build headers object from headersList
      const headersObj = {};
      headersList.forEach(h => {
        if (h.enabled && h.key.trim()) {
          headersObj[h.key.trim()] = h.value;
        }
      });
      
      // Add auth header if applicable
      if (authType === "bearer" && bearerToken.trim()) {
        headersObj["Authorization"] = `Bearer ${bearerToken.trim()}`;
      }
      
      const parsedBody = body ? JSON.parse(body) : null;
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }
      
      const res = await fetch("http://localhost:8000/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          method,
          url,
          headers: headersObj,
          body: parsedBody,
        }),
      });
      
      const data = await res.json();
      
      if (res.status === 401) {
        localStorage.removeItem("token");
        onLogout();
        throw new Error("Session expired. Please log in again.");
      }
      
      if (!res.ok) {
        throw new Error(data.detail?.error || data.detail || "Request failed");
      }
      
      setResponse(data);
      fetchLogs();
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      onLogout();
    }
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  const getMethodColor = (m) => {
    const colors = {
      GET: "bg-red-500",
      POST: "bg-red-600",
      PUT: "bg-red-700",
      DELETE: "bg-red-800",
      PATCH: "bg-red-500",
    };
    return colors[m] || "bg-neutral-500";
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return "text-red-500";
    if (status >= 400 && status < 500) return "text-red-600";
    if (status >= 500) return "text-red-700";
    return "text-neutral-400";
  };
  

  return (
    <div className="min-h-screen bg-black">
      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h3 className="text-white font-semibold">Save Request</h3>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName("");
                }}
                className="text-neutral-500 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                  Request Name (Optional)
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Leave empty for auto-generated name"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => saveRequest(saveName || null)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveName("");
                  }}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold py-2 px-4 rounded transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-red-500" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Playground</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Professional API Testing Tool</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 hover:text-red-500 hover:border-red-500 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full p-6 space-y-6">
        {/* Saved Requests Section */}
        <div className="bg-neutral-950 rounded border border-neutral-800">
          <button
            onClick={() => setSavedExpanded(!savedExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-neutral-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookmarkCheck className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Saved Requests ({savedRequests.length})
              </h2>
            </div>
            {savedExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {savedExpanded && (
            <div className="border-t border-neutral-800">
              {savedLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">Loading saved requests...</p>
                </div>
              ) : savedRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-neutral-500 text-sm">No saved requests yet</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {savedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="px-6 py-3 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-900 transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getMethodColor(req.method)}`}>
                            {req.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{req.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{req.url}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadRequest(req)}
                            className="p-2 rounded-full bg-neutral-800 hover:bg-red-600 text-neutral-400 hover:text-white transition-all"
                            title="Load request"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRequest(req.id)}
                            className="p-2 rounded-full bg-neutral-800 hover:bg-red-600 text-neutral-400 hover:text-white transition-all"
                            title="Delete request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logs Section */}
        <div className="bg-neutral-950 rounded border border-neutral-800">
          <button
            onClick={() => setLogsExpanded(!logsExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-neutral-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Request History ({logs.length})
              </h2>
            </div>
            {logsExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {logsExpanded && (
            <div className="border-t border-neutral-800">
              {logsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-neutral-500 text-sm">No requests yet</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="px-6 py-3 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getMethodColor(log.method)}`}>
                            {log.method}
                          </span>
                          <span className={`text-sm font-bold ${getStatusColor(log.status_code)}`}>
                            {log.status_code || "---"}
                          </span>
                          <span className="text-sm text-neutral-400 truncate flex-1">
                            {log.url}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span>{log.response_time_ms}ms</span>
                          <span className="whitespace-nowrap">{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Request/Response Section */}
        {/* Main Tabs */}
        <div className="bg-neutral-950 rounded border border-neutral-800 mb-6">
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveMainTab("request")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeMainTab === "request"
                  ? "bg-neutral-900 text-red-500 border-b-2 border-red-500"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              API Request
            </button>
            <button
              onClick={() => setActiveMainTab("ratelimit")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeMainTab === "ratelimit"
                  ? "bg-neutral-900 text-red-500 border-b-2 border-red-500"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              Rate Limit Test
            </button>
            <button
                  onClick={() => setActiveMainTab("openapi")}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeMainTab === "openapi"
                      ? "bg-neutral-900 text-red-500 border-b-2 border-red-500"
                      : "text-neutral-400 hover:text-neutral-300"
                  }`}
                >
                  OpenAPI Docs
                </button>
          </div>
        </div>

        {/* Request/Response Section */}
        {activeMainTab === "request" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Request */}
            <div className="space-y-4">
              <div className="bg-neutral-950 rounded border border-neutral-800">
                <div className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Request</h2>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={!url}
                    className="p-2 rounded-full bg-neutral-800 hover:bg-red-600 text-neutral-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save request"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>PATCH</option>
                      <option>DELETE</option>
                    </select>
                    
                    <div className="flex-1">
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.example.com/endpoint"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="border-b border-neutral-800">
                    <div className="flex gap-6">
                      <button
                        onClick={() => setActiveTab("body")}
                        className={`pb-2 px-1 text-sm font-medium transition-colors ${
                          activeTab === "body"
                            ? "text-red-500 border-b-2 border-red-500"
                            : "text-neutral-400 hover:text-neutral-300"
                        }`}
                      >
                        Body
                      </button>
                      <button
                        onClick={() => setActiveTab("headers")}
                        className={`pb-2 px-1 text-sm font-medium transition-colors ${
                          activeTab === "headers"
                            ? "text-red-500 border-b-2 border-red-500"
                            : "text-neutral-400 hover:text-neutral-300"
                        }`}
                      >
                        Headers
                      </button>
                      <button
                        onClick={() => setActiveTab("auth")}
                        className={`pb-2 px-1 text-sm font-medium transition-colors ${
                          activeTab === "auth"
                            ? "text-red-500 border-b-2 border-red-500"
                            : "text-neutral-400 hover:text-neutral-300"
                        }`}
                      >
                        Auth
                      </button>
                    </div>
                  </div>

                  {activeTab === "body" && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                        Request Body (JSON)
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder='{\n  "key": "value"\n}'
                        className="w-full px-3 py-3 bg-neutral-900 border border-neutral-700 rounded font-mono text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                        rows={10}
                      />
                    </div>
                  )}

                  {activeTab === "headers" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide">
                          Custom Headers
                        </label>
                        <button
                          onClick={addHeader}
                          className="text-xs text-red-500 hover:text-red-400 font-medium"
                        >
                          + Add Header
                        </button>
                      </div>
                      <div className="space-y-2">
                        {headersList.map((header, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="checkbox"
                              checked={header.enabled}
                              onChange={(e) => updateHeader(idx, "enabled", e.target.checked)}
                              className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 focus:ring-offset-neutral-950"
                            />
                            <input
                              type="text"
                              value={header.key}
                              onChange={(e) => updateHeader(idx, "key", e.target.value)}
                              placeholder="Header name"
                              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                            <input
                              type="text"
                              value={header.value}
                              onChange={(e) => updateHeader(idx, "value", e.target.value)}
                              placeholder="Value"
                              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                            <button
                              onClick={() => removeHeader(idx)}
                              className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "auth" && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wide">
                        Authorization Type
                      </label>
                      <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 mb-4"
                      >
                        <option value="none">No Auth</option>
                        <option value="bearer">Bearer Token</option>
                      </select>

                      {authType === "bearer" && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                            Bearer Token
                          </label>
                          <input
                            type="text"
                            value={bearerToken}
                            onChange={(e) => setBearerToken(e.target.value)}
                            placeholder="Enter your bearer token"
                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          />
                          <p className="text-xs text-neutral-500 mt-2">
                            This will be sent as: <span className="font-mono text-neutral-400">Authorization: Bearer [token]</span>
                          </p>
                        </div>
                      )}

                      {authType === "none" && (
                        <div className="text-center py-8">
                          <p className="text-neutral-500 text-sm">No authentication will be used</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={sendRequest}
                    disabled={loading || !url}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-semibold py-2.5 px-6 rounded transition-all duration-150 flex items-center justify-center gap-2 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Request
                      </>
                    ) : (
                      <>
                        Send Request
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-950 border border-red-800 rounded">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-400 text-sm">Request Failed</p>
                        <p className="text-xs text-red-300 mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Response */}
            <div className="space-y-4">
              <div className="bg-neutral-950 rounded border border-neutral-800">
                <div className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Response</h2>
                  {response?.rate_limit && (
                    <div className="text-xs text-neutral-500">
                      Rate Limit: {response.rate_limit.remaining}/{response.rate_limit.limit}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  {!response && !loading && (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
                        <Send className="w-6 h-6 text-neutral-600" />
                      </div>
                      <p className="text-neutral-400 font-medium text-sm">No Response</p>
                      <p className="text-xs text-neutral-600 mt-1">Send a request to view the response</p>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-20">
                      <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
                      <p className="text-neutral-400 font-medium text-sm">Awaiting Response</p>
                    </div>
                  )}

                  {response && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-neutral-900 rounded p-3 border border-neutral-800">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-3 h-3 text-neutral-500" />
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</p>
                          </div>
                          <p className={`text-xl font-bold ${getStatusColor(response.status)}`}>
                            {response.status}
                          </p>
                        </div>

                        <div className="bg-neutral-900 rounded p-3 border border-neutral-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Time</p>
                          </div>
                          <p className="text-xl font-bold text-white">
                            {response.response_time}
                            <span className="text-xs font-normal text-neutral-500 ml-1">ms</span>
                          </p>
                        </div>

                        <div className="bg-neutral-900 rounded p-3 border border-neutral-800">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${getMethodColor(method)}`}></span>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Method</p>
                          </div>
                          <p className="text-xl font-bold text-white">{method}</p>
                        </div>
                      </div>

                      <div className="border-b border-neutral-800">
                        <div className="flex gap-6">
                          <button
                            onClick={() => setResponseTab("body")}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${
                              responseTab === "body"
                                ? "text-red-500 border-b-2 border-red-500"
                                : "text-neutral-400 hover:text-neutral-300"
                            }`}
                          >
                            Body
                          </button>
                          <button
                            onClick={() => setResponseTab("headers")}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${
                              responseTab === "headers"
                                ? "text-red-500 border-b-2 border-red-500"
                                : "text-neutral-400 hover:text-neutral-300"
                            }`}
                          >
                            Headers
                          </button>
                        </div>
                      </div>

                      {responseTab === "body" && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                            Response Body
                          </label>
                          <div className="bg-neutral-900 rounded p-4 overflow-x-auto border border-neutral-800 max-h-96 overflow-y-auto">
                            <pre className="text-xs text-neutral-300 font-mono leading-relaxed">
                              {JSON.stringify(response.body, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {responseTab === "headers" && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                            Response Headers
                          </label>
                          <div className="bg-neutral-900 rounded p-4 border border-neutral-800 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                              {Object.entries(response.headers).map(([key, value]) => (
                                <div key={key} className="flex gap-2 text-xs font-mono">
                                  <span className="font-semibold text-red-400 min-w-fit">{key}:</span>
                                  <span className="text-neutral-400 break-all">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Test Section */}
        {activeMainTab === "ratelimit" && (
          <RateLimitTest />
        )}
        {activeMainTab === "openapi" && (
          <OpenAPILoader onLoadEndpoint={handleLoadEndpoint} />
        )}
      </div>
    </div>
  );
}

export default RequestBuilder;