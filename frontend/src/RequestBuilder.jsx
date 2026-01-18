import { useState } from "react";
import { Send, Loader2, AlertCircle, CheckCircle2, Clock, Code } from "lucide-react";

function RequestBuilder() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("body");
  const [responseTab, setResponseTab] = useState("body");

  async function sendRequest() {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const parsedHeaders = headers ? JSON.parse(headers) : {};
      const parsedBody = body ? JSON.parse(body) : null;
      
      const res = await fetch("http://localhost:8000/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          url,
          headers: parsedHeaders,
          body: parsedBody,
        }),
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message || "Request failed");
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

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return "text-red-500";
    if (status >= 400 && status < 500) return "text-red-600";
    if (status >= 500) return "text-red-700";
    return "text-neutral-400";
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center gap-3">
            <Code className="w-6 h-6 text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Playground</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Professional API Testing Tool</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Request */}
          <div className="space-y-4">
            <div className="bg-neutral-950 rounded border border-neutral-800">
              <div className="border-b border-neutral-800 px-6 py-3">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Request</h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Method + URL */}
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

                {/* Tabs */}
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
                  </div>
                </div>

                {/* Tab Content */}
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
                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                      Custom Headers (JSON)
                    </label>
                    <textarea
                      value={headers}
                      onChange={(e) => setHeaders(e.target.value)}
                      placeholder='{\n  "Authorization": "Bearer token",\n  "Custom-Header": "value"\n}'
                      className="w-full px-3 py-3 bg-neutral-900 border border-neutral-700 rounded font-mono text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                      rows={10}
                    />
                  </div>
                )}

                {/* Send Button */}
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
                      <Send className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>

                {/* Error Message */}
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
              <div className="border-b border-neutral-800 px-6 py-3">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Response</h2>
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
                    {/* Status Info */}
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

                    {/* Response Tabs */}
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

                    {/* Response Content */}
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
      </div>
    </div>
  );
}

export default RequestBuilder;