import { useState } from "react";
import Dashboard from "./Pages/Dashboard";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/api";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem(
      "currentUser"
    );

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError(
        "Please enter your email and password."
      );
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Login failed."
        );
      }

      setCurrentUser(data.user);

      if (rememberMe) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(data.user)
        );
      }

    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "currentUser"
    );

    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setLoginError("");
  };

  if (currentUser) {
    return (
      <Dashboard
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="login-page">
      <main className="main-content">
        <div className="background-overlay"></div>

        <section className="login-card">
          <div className="login-logo">
            <span>🌱</span>
          </div>

          <h2>Farm Time</h2>

          <p className="system-title">
            Management System
          </p>

          <div className="welcome">
            <h3>Welcome back!</h3>

            <p>
              Login to your administrator account
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-wrapper">
              <span className="input-icon">
                ✉
              </span>

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                autoComplete="email"
                required
              />
            </div>

            <div className="input-wrapper">
              <span className="input-icon">
                🔒
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => {
                  setShowPassword(
                    (currentValue) => !currentValue
                  );
                }}
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {loginError && (
              <p className="login-error">
                {loginError}
              </p>
            )}

            <div className="form-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => {
                    setRememberMe(
                      event.target.checked
                    );
                  }}
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-link"
                onClick={() => {
                  setLoginError(
                    "Contact an administrator to reset your password."
                  );
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoggingIn}
            >
              {isLoggingIn
                ? "Signing in..."
                : "Login"}
            </button>
          </form>

          <p className="signup-text">
            Administrator access only
          </p>
        </section>

        <button
          className="help-button"
          type="button"
          onClick={() => {
            window.alert(
              "Contact your system administrator for help."
            );
          }}
        >
          ?
        </button>
      </main>
    </div>
  );
}

export default App;