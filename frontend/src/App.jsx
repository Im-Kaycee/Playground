import { useState, useEffect } from "react";
import RequestBuilder from "./RequestBuilder";
import Auth from "./Auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has a valid token on mount
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  function handleAuthSuccess() {
    setIsAuthenticated(true);
  }

  function handleLogout() {
    setIsAuthenticated(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <RequestBuilder onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

export default App;