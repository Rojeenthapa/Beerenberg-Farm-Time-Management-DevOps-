import { useEffect, useState } from "react";
import "./App.css";
import Dashboard from "./Pages/Dashboard";


function App() {
  const [admin, setAdmin] = useState(null);
  const [isCheckingSession, setIsCheckingSession] =
    useState(true);
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);
  const [loginError, setLoginError] =
    useState("");
  const [isLoggingIn, setIsLoggingIn] =
    useState(false);


  useEffect(() => {
    checkCurrentSession();
  }, []);


  async function readResponse(response) {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    return {
      error: `Request failed with status ${response.status}.`
    };
  }


  async function checkCurrentSession() {
    try {
      const response = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          credentials: "include"
        }
      );

      if (!response.ok) {
        setAdmin(null);
        return;
      }

      const data = await readResponse(response);

      if (data.authenticated && data.admin) {
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsCheckingSession(false);
    }
  }


  async function handleLogin(event) {
    event.preventDefault();

    if (isLoggingIn) {
      return;
    }

    const formData = new FormData(
      event.currentTarget
    );

    const email = String(
      formData.get("email") || ""
    ).trim();

    const password = String(
      formData.get("password") || ""
    );

    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
            remember_me: rememberMe
          })
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Login failed."
        );
      }

      if (!data.admin) {
        throw new Error(
          "Login succeeded, but no admin account was returned."
        );
      }

      setAdmin(data.admin);
    } catch (error) {
      setLoginError(
        error.message ||
        "Unable to connect to the backend."
      );
    } finally {
      setIsLoggingIn(false);
    }
  }


  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include"
        }
      );
    } catch {
      // Clear the frontend session even if the server request fails.
    } finally {
      setAdmin(null);
      setLoginError("");
    }
  }


  function clearLoginError() {
    if (loginError) {
      setLoginError("");
    }
  }


  if (isCheckingSession) {
    return (
      <div className="login-page">
        <main className="login-main">
          <section className="login-card">
            <p>Checking login...</p>
          </section>
        </main>
      </div>
    );
  }


  if (!admin) {
    return (
      <div className="login-page">
        <main className="login-main">
          <div className="background-overlay"></div>

          <section className="login-card">
            <div className="login-logo">
              <span>⌁</span>
            </div>

            <h2>Farm Time</h2>

            <p className="system-title">
              Management System
            </p>

            <div className="welcome">
              <h3>Welcome back!</h3>
              <p>Login to your account</p>
            </div>

            {loginError && (
              <p
                className="login-error"
                role="alert"
              >
                {loginError}
              </p>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-wrapper">
                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  autoComplete="email"
                  onChange={clearLoginError}
                  required
                />
              </div>

              <div className="input-wrapper">
                <span className="input-icon">
                  ♙
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  onChange={clearLoginError}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>

              <div className="form-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                  />

                  <span>Remember me</span>
                </label>

                <a
                  href="#"
                  className="forgot-link"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoggingIn}
              >
                {isLoggingIn
                  ? "Logging in..."
                  : "Login"}
              </button>
            </form>

            <p className="signup-text">
              Don't have an account?{" "}
              <a
                href="#"
                onClick={(event) =>
                  event.preventDefault()
                }
              >
                Sign up
              </a>
            </p>
          </section>

          <button
            type="button"
            className="help-button"
            onClick={() =>
              alert(
                "Please contact the system administrator."
              )
            }
          >
            ?
          </button>
        </main>
      </div>
    );
  }


  return (
    <Dashboard
      admin={admin}
      onLogout={handleLogout}
    />
  );
}


export default App;