import { useState } from "react";
import "./App.css";

function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const menuItems = [
    { icon: "▦", label: "Dashboard", active: true },
    { icon: "♙", label: "Employees" },
    { icon: "✓", label: "Tasks" },
    { icon: "▣", label: "Schedules" },
    { icon: "⌂", label: "Livestock" },
    { icon: "⌘", label: "Equipment" },
    { icon: "▥", label: "Reports" },
    { icon: "⚙", label: "Settings" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login submitted");
  };

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            <span>⌁</span>
          </div>

          <div className="brand-text">
            <h1>Farm Time</h1>
            <p>Management System</p>
          </div>
        </div>

        <nav className="navigation">
          {menuItems.map((item) => (
            <a
              href="#"
              key={item.label}
              className={`nav-item ${
                item.active ? "active" : ""
              }`}
              onClick={(e) => e.preventDefault()}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="logout-container">
          <a
            href="#"
            className="nav-item logout"
            onClick={(e) => e.preventDefault()}
          >
            <span className="nav-icon">
              ↪
            </span>

            <span>Logout</span>
          </a>
        </div>

      </aside>


      {/* Main Content */}
      <main className="main-content">

        <div className="background-overlay"></div>


        {/* Login Card */}
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

            <p>
              Login to your account
            </p>
          </div>


          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="input-wrapper">

              <span className="input-icon">
                ✉
              </span>

              <input
                type="email"
                placeholder="Email address"
                required
              />

            </div>


            {/* Password */}
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
                placeholder="Password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "◉" : "◌"}
              </button>

            </div>


            {/* Remember / Forgot */}
            <div className="form-options">

              <label className="remember">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span>
                  Remember me
                </span>

              </label>


              <a
                href="#"
                className="forgot-link"
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


          {/* Sign Up */}
          <p className="signup-text">
            Don't have an account?{" "}

            <a href="#">
              Sign up
            </a>
          </p>

        </section>


        {/* Help */}
        <button className="help-button">
          ?
        </button>

      </main>

    </div>
  );
}

export default App;
