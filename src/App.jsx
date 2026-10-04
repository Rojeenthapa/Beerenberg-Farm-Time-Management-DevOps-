import {
  useEffect,
  useState
} from "react";

import {
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  UserRound
} from "lucide-react";

import Dashboard from "./Pages/Dashboard";

import {
  apiRequest,
  clearStoredUser,
  getStoredUser
} from "./api";

import "./App.css";


function App() {
  const [currentUser, setCurrentUser] =
    useState(() => getStoredUser());

  const [loginId, setLoginId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    const validateSession = async () => {
      const storedUser = getStoredUser();

      if (!storedUser) {
        setCheckingSession(false);
        return;
      }

      try {
        const user = await apiRequest(
          "/me"
        );

        setCurrentUser(user);

      } catch {
        clearStoredUser();
        setCurrentUser(null);

      } finally {
        setCheckingSession(false);
      }
    };

    validateSession();
  }, []);


  const handleLogin = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const cleanLoginId = loginId.trim();

    if (!cleanLoginId) {
      setError(
        "Please enter your user ID."
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest(
        "/login",
        {
          method: "POST",
          body: JSON.stringify({
            login_id: cleanLoginId,
            password
          })
        }
      );

      if (rememberMe) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(
            response.user
          )
        );

        sessionStorage.removeItem(
          "currentUser"
        );

      } else {
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify(
            response.user
          )
        );

        localStorage.removeItem(
          "currentUser"
        );
      }

      setCurrentUser(
        response.user
      );

      setPassword("");

    } catch (requestError) {
      setError(
        requestError.message ||
        "Unable to sign in."
      );

    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    clearStoredUser();

    setCurrentUser(null);
    setLoginId("");
    setPassword("");
    setError("");
  };


  if (checkingSession) {
    return (
      <main className="loading-page">
        <div className="loading-card">
          <Leaf size={28} />

          <span>
            Loading Farm Time...
          </span>
        </div>
      </main>
    );
  }


  if (currentUser) {
    return (
      <Dashboard
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }


  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Leaf size={25} />
          </div>

          <div>
            <h1>
              Farm Time
            </h1>

            <span>
              Management System
            </span>
          </div>
        </div>

        <div className="auth-heading">
          <h2>
            Welcome back!
          </h2>

          <p>
            Login to your account
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <div className="auth-field">
            <label htmlFor="loginId">
              User ID
            </label>

            <div className="auth-input-wrapper">
              <UserRound
                size={17}
                className="auth-input-icon"
              />

              <input
                id="loginId"
                name="login_id"
                type="text"
                value={loginId}
                placeholder="Enter your user ID"
                autoComplete="username"
                disabled={loading}
                onChange={(event) => {
                  setLoginId(
                    event.target.value
                  );
                }}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <div className="auth-input-wrapper">
              <LockKeyhole
                size={17}
                className="auth-input-icon"
              />

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );
                }}
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={loading}
                onClick={() => {
                  setShowPassword(
                    (value) => !value
                  );
                }}
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={loading}
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
              className="forgot-password"
              disabled={loading}
              onClick={() => {
                setError(
                  "Please contact your administrator to reset your password."
                );
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </button>
        </form>

        <div className="auth-signup">
          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setError(
                "Please contact your administrator to create an account."
              );
            }}
          >
            Sign up
          </button>
        </div>

        <p className="auth-footer">
          © 2026 Farm Time Management System
        </p>
      </section>
    </main>
  );
}


export default App;