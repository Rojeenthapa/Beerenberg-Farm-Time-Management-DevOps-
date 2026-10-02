import { useState } from "react";
import "./App.css";
import Dashboard from "./Pages/Dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // Frontend only for now.
    // No email/password validation.
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <main className="login-main">
          <div className="background-overlay"></div>

          <section className="login-card">
            {/* Logo */}
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

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  type="email"
                  placeholder="Email address"
                />
              </div>

              {/* Password */}
              <div className="input-wrapper">
                <span className="input-icon">♙</span>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>

              {/* Remember/Forgot */}
              <div className="form-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                  />

                  <span>Remember me</span>
                </label>

                <a
                  href="#"
                  className="forgot-link"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot Password?
                </a>
              </div>

              {/* Login */}
              <button
                type="submit"
                className="login-button"
              >
                Login
              </button>
            </form>

            <p className="signup-text">
              Don't have an account?{" "}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Sign up
              </a>
            </p>
          </section>

          <button className="help-button">
            ?
          </button>
        </main>
      </div>
    );
  }

  // =========================
  // AFTER LOGIN
  // =========================

  return <Dashboard onLogout={handleLogout} />;
}

export default App;