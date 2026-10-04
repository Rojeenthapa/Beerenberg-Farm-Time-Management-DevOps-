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
  const [activePage, setActivePage] =
    useState("Dashboard");

  const isAdmin = Boolean(
    currentUser?.is_admin
  );

  const fullName = [
    currentUser?.first_name,
    currentUser?.last_name
  ]
    .filter(Boolean)
    .join(" ");

  const displayName =
    fullName || "User";

  const navigationItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      adminOnly: false
    },
    {
      label: "Clock In/Out",
      icon: Clock3,
      adminOnly: false
    },
    {
      label: "Hours Reporting",
      icon: FileText,
      adminOnly: false
    },
    {
      label: "Roster",
      icon: CalendarDays,
      adminOnly: false
    },
    {
      label: "Payroll",
      icon: CreditCard,
      adminOnly: false
    },
    {
      label: "Employees",
      icon: Users,
      adminOnly: true
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      adminOnly: false
    }
  ];

  const visibleNavigationItems =
    navigationItems.filter(
      (item) =>
        !item.adminOnly || isAdmin
    );

  const handlePageChange = (page) => {
    const requestedPage =
      navigationItems.find(
        (item) => item.label === page
      );

    if (
      requestedPage?.adminOnly &&
      !isAdmin
    ) {
      setActivePage("Dashboard");
      return;
    }

    setActivePage(page);
  };

  const renderPage = () => {
    if (
      activePage === "Employees" &&
      isAdmin
    ) {
      return (
        <Employees />
      );
    }

    if (
      activePage === "Payroll" &&
      isAdmin
    ) {
      return (
        <Payroll />
      );
    }

    if (activePage === "Clock In/Out") {
      return (
        <ClockInOut />
      );
    }

    if (activePage === "Hours Reporting") {
      return (
        <HoursReporting />
      );
    }

    if (activePage === "Roster") {
      return (
        <Roster />
      );
    }

    if (activePage === "Settings") {
      return (
        <Settings />
      );
    }

    return (
      <section className="dashboard-content">
        <h1>
          Dashboard
        </h1>

        <p className="page-description">
          Welcome back, {displayName}.
        </p>

        <div className="dashboard-section">
          <h2>
            Farm Time Management System
          </h2>

          <p>
            Use the navigation menu to access
            the features available to your account.
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
            <h1>
              Farm Time
            </h1>

            <p>
              Management System
            </p>
          </div>
        </div>

        <nav className="navigation">
          {visibleNavigationItems.map((item) => {
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
                  handlePageChange(
                    item.label
                  );
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
            {displayName} ·{" "}
            {currentUser?.role}
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}

export default Dashboard;