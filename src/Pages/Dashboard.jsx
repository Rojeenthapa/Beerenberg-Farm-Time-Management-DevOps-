import { useState } from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  Users,
  Clock3
} from "lucide-react";

import Employees from "./Employees";
import ClockInOut from "./ClockInOut";
import HoursReporting from "./HoursReporting";
import Roster from "./Roster";
import Payroll from "./Payroll";
import Settings from "./Settings";

import "../styles/Dashboard.css";

function Dashboard({
  currentUser,
  onLogout
}) {
  const [activePage, setActivePage] = useState(
    "Dashboard"
  );

  const fullName = [
    currentUser?.first_name,
    currentUser?.last_name
  ]
    .filter(Boolean)
    .join(" ");

  const displayName = fullName || "Administrator";

  const navigationItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      label: "Employees",
      icon: Users
    },
    {
      label: "Clock In/Out",
      icon: Clock3
    },
    {
      label: "Hours Reporting",
      icon: FileText
    },
    {
      label: "Roster",
      icon: CalendarDays
    },
    {
      label: "Payroll",
      icon: CreditCard
    },
    {
      label: "Settings",
      icon: SettingsIcon
    }
  ];

  const renderPage = () => {
    if (activePage === "Employees") {
      return <Employees />;
    }

    if (activePage === "Clock In/Out") {
      return <ClockInOut />;
    }

    if (activePage === "Hours Reporting") {
      return <HoursReporting />;
    }

    if (activePage === "Roster") {
      return <Roster />;
    }

    if (activePage === "Payroll") {
      return <Payroll />;
    }

    if (activePage === "Settings") {
      return <Settings />;
    }

    return (
      <section className="dashboard-content">
        <h1>Dashboard</h1>

        <p className="page-description">
          Welcome back, {displayName}.
        </p>

        <div className="dashboard-section">
          <h2>
            Farm Time Management System
          </h2>

          <p>
            Use the navigation menu to manage
            employees, time logs, rosters, and payroll.
          </p>
        </div>
      </section>
    );
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            🌱
          </div>

          <div className="brand-text">
            <h1>Farm Time</h1>
            <p>Management System</p>
          </div>
        </div>

        <nav className="navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={
                  activePage === item.label
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => {
                  setActivePage(item.label);
                }}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="logout-container">
          <button
            type="button"
            className="nav-item logout"
            onClick={onLogout}
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2>
            {activePage}
          </h2>

          <div className="user-info">
            {displayName} · {currentUser?.role}
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}

export default Dashboard;