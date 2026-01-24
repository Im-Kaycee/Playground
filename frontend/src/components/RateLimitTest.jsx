import { useState } from "react";
import { Loader2, AlertCircle, Zap, Activity, TrendingUp, Clock } from "lucide-react";

function RateLimitTest() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [rps, setRps] = useState(10);
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  // Auth state
  const [authType, setAuthType] = useState("none");
  const [bearerToken, setBearerToken] = useState("");
  
  // Headers as array of key-value pairs
  const [headersList, setHeadersList] = useState([{ key: "", value: "", enabled: true }]);

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

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    
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
      
      const res = await fetch("http://localhost:8000/api/rate-limit-test", {
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
          rps,
          duration,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail?.error || data.detail || "Test failed");
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message || "Test failed");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <div className="bg-neutral-950 rounded border border-neutral-800">
        <div className="border-b border-neutral-800 px-6 py-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Rate Limit Test Configuration</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Requests Per Second (1-1000)
              </label>
              <input
                type="number"
                value={rps}
                onChange={(e) => setRps(parseInt(e.target.value) || 1)}
                min="1"
                max="1000"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Duration in Seconds (1-60)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                min="1"
                max="60"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Request Body */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Request Body (JSON) - Optional
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{\n  "key": "value"\n}'
              className="w-full px-3 py-3 bg-neutral-900 border border-neutral-700 rounded font-mono text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={6}
            />
          </div>

          {/* Headers */}
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
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auth */}
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
              </div>
            )}
          </div>

          <button
            onClick={runTest}
            disabled={loading || !url}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-semibold py-2.5 px-6 rounded transition-all duration-150 flex items-center justify-center gap-2 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Rate Limit Test
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-950 border border-red-800 rounded">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400 text-sm">Test Failed</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-neutral-950 rounded border border-neutral-800">
          <div className="border-b border-neutral-800 px-6 py-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Test Results</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-neutral-900 rounded p-4 border border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Requests</p>
                </div>
                <p className="text-2xl font-bold text-white">{result.total_requests}</p>
              </div>

              <div className="bg-neutral-900 rounded p-4 border border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Successful</p>
                </div>
                <p className="text-2xl font-bold text-green-500">{result.successful_requests}</p>
              </div>

              <div className="bg-neutral-900 rounded p-4 border border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Rate Limited</p>
                </div>
                <p className="text-2xl font-bold text-red-500">{result.rate_limited_requests}</p>
              </div>

              <div className="bg-neutral-900 rounded p-4 border border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Other Errors</p>
                </div>
                <p className="text-2xl font-bold text-yellow-500">{result.other_errors}</p>
              </div>
            </div>

            {result.first_429_at_request && (
              <div className="bg-neutral-900 rounded p-4 border border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-semibold text-red-400 uppercase tracking-wide">Rate Limit Detected</p>
                </div>
                <div className="space-y-2 text-sm text-neutral-300">
                  <p>First 429 response at request <span className="font-bold text-white">#{result.first_429_at_request}</span></p>
                  <p>Occurred at second <span className="font-bold text-white">{result.first_429_at_second}</span> of the test</p>
                  {result.max_safe_rps_estimate && (
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <p className="text-green-400">
                        Estimated safe RPS: <span className="font-bold text-white">{result.max_safe_rps_estimate}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!result.first_429_at_request && (
              <div className="bg-neutral-900 rounded p-4 border border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-sm font-semibold text-green-400 uppercase tracking-wide">No Rate Limits Hit</p>
                </div>
                <p className="text-sm text-neutral-300">
                  All {result.total_requests} requests completed without hitting rate limits.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RateLimitTest;