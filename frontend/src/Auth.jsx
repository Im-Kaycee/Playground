import { useState } from "react";
import { Code, Loader2, AlertCircle } from "lucide-react";

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email, password }
        : { email, username, password };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (isLogin) {
        // Login successful - save token
        localStorage.setItem("token", data.access_token);
        onAuthSuccess();
      } else {
        // Register successful - switch to login
        setIsLogin(true);
        setError(null);
        setPassword("");
        alert("Registration successful! Please log in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Code className="w-10 h-10 text-red-500" />
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Playground
            </h1>
          </div>
          <p className="text-neutral-400 text-sm">
            Professional API Testing Tool
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-neutral-900 text-red-500 border-b-2 border-red-500"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-neutral-900 text-red-500 border-b-2 border-red-500"
                  : "text-neutral-400 hover:text-neutral-300"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Username (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required={!isLogin}
                  minLength={3}
                  maxLength={50}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
              {!isLogin && (
                <p className="text-xs text-neutral-500 mt-1">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-950 border border-red-800 rounded">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-400 text-sm">Error</p>
                  <p className="text-xs text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-semibold py-2.5 px-6 rounded transition-all duration-150 flex items-center justify-center gap-2 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? "Logging in..." : "Registering..."}
                </>
              ) : (
                <>{isLogin ? "Login" : "Register"}</>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-600 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-red-500 hover:text-red-400 font-medium"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;