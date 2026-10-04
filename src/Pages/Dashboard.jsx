import { useEffect, useState } from "react";

import {
  CalendarDays,
  CircleCheck,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  Leaf,
  LogOut,
  Settings as SettingsIcon,
  Sprout,
  UserRound,
  Users
} from "lucide-react";

import Employees from "./Employees";
import ClockInOut from "./ClockInOut";
import HoursReporting from "./HoursReporting";
import Roster from "./Roster";
import Payroll from "./Payroll";
import Settings from "./Settings";

import {
  apiRequest
} from "../api";

import "../styles/Dashboard.css";


function Dashboard({
  currentUser,
  onLogout
}) {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [dashboardData, setDashboardData] =
    useState({
      employeeCount: 0,
      clockedInCount: 0,
      totalHours: "0h 00m",
      recentLogs: []
    });

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [dashboardError, setDashboardError] =
    useState("");

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
      label: "Employees",
      icon: Users,
      adminOnly: true
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

  const getDateRange = () => {
    const today = new Date();

    const fromDate = new Date();

    fromDate.setDate(
      today.getDate() - 13
    );

    return {
      fromDate: fromDate
        .toISOString()
        .slice(0, 10),

      toDate: today
        .toISOString()
        .slice(0, 10)
    };
  };

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const {
        fromDate,
        toDate
      } = getDateRange();

      const hoursResponse = await apiRequest(
        `/hours?from_date=${fromDate}&to_date=${toDate}`
      );

      const timeLogsResponse = await apiRequest(
        `/timelogs?date=${today}`
      );

      let employeeCount = 0;

      if (isAdmin) {
        const countResponse =
          await apiRequest(
            "/dashboard/employee-count"
          );

        employeeCount =
          Number(
            countResponse.employee_count
          ) || 0;
      }

      const clockedInCount =
        timeLogsResponse.filter(
          (timeLog) =>
            timeLog.clock_out === null
        ).length;

      const recentLogs =
        timeLogsResponse
          .slice(0, 5)
          .map((timeLog) => ({
            ...timeLog,
            employee_name:
              isAdmin
                ? timeLog.employee_name ||
                  "Employee"
                : displayName
          }));

      setDashboardData({
        employeeCount,
        clockedInCount,
        totalHours:
          hoursResponse.total_hours_display ||
          "0h 00m",
        recentLogs
      });

    } catch (requestError) {
      setDashboardError(
        requestError.message
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (
      activePage === "Dashboard" &&
      currentUser
    ) {
      loadDashboardData();
    }
  }, [
    activePage,
    currentUser?.user_id,
    isAdmin
  ]);

  const handlePageChange = (page) => {
    const selectedPage =
      navigationItems.find(
        (item) => item.label === page
      );

    if (
      selectedPage?.adminOnly &&
      !isAdmin
    ) {
      setActivePage("Dashboard");
      return;
    }

    setActivePage(page);
  };

  const formatClockTime = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value)
      .toLocaleTimeString(
        "en-AU",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }
      );
  };

  const DashboardHome = () => (
    <div className="dashboard-home">
      <header className="dashboard-top-header">
        <h1>
          Dashboard
        </h1>

        <div className="dashboard-admin">
          <span>
            Welcome, {displayName}
          </span>

          <div className="admin-circle">
            <UserRound size={18} />
          </div>
        </div>
      </header>

      {dashboardError && (
        <div className="dashboard-error">
          {dashboardError}
        </div>
      )}

      <section
        className={
          isAdmin
            ? "dashboard-top-cards"
            : "dashboard-top-cards single-card"
        }
      >
        {isAdmin && (
          <div className="dashboard-summary-card">
            <div className="summary-circle">
              <Users size={21} />
            </div>

            <div className="summary-info">
              <p>
                Employees
              </p>

              <h2>
                {dashboardLoading
                  ? "..."
                  : dashboardData.employeeCount}
              </h2>

              <button
                type="button"
                onClick={() => {
                  handlePageChange(
                    "Employees"
                  );
                }}
              >
                View employees
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-summary-card">
          <div className="summary-circle">
            <Clock3 size={21} />
          </div>

          <div className="summary-info">
            <p>
              Clocked In Now
            </p>

            <h2>
              {dashboardLoading
                ? "..."
                : dashboardData.clockedInCount}
            </h2>

            <button
              type="button"
              onClick={() => {
                handlePageChange(
                  "Clock In/Out"
                );
              }}
            >
              View clocking
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-middle">
        <div className="dashboard-panel clocked-panel">
          <div className="dashboard-panel-heading">
            <h3>
              Hours This Period
            </h3>

            <button
              type="button"
              onClick={() => {
                handlePageChange(
                  "Hours Reporting"
                );
              }}
            >
              View report
            </button>
          </div>

          <div className="clocked-content">
            <div className="clocked-icon">
              <Clock3 size={25} />
            </div>

            <div>
              <h2>
                {dashboardLoading
                  ? "..."
                  : dashboardData.totalHours}
              </h2>

              <p>
                Total recorded worked hours
              </p>

              <span>
                Last 14 days
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-panel schedules-panel">
          <div className="dashboard-panel-heading schedules-heading">
            <h3>
              Quick Actions
            </h3>
          </div>

          <div className="dashboard-schedule-row">
            <div className="schedule-circle">
              <Sprout size={17} />
            </div>

            <div>
              <h4>
                Clock In / Clock Out
              </h4>

              <p>
                Record employee attendance
              </p>
            </div>

            <button
              type="button"
              className="dashboard-row-action"
              onClick={() => {
                handlePageChange(
                  "Clock In/Out"
                );
              }}
            >
              Open
            </button>
          </div>

          <div className="dashboard-schedule-row">
            <div className="schedule-circle">
              <CalendarDays size={17} />
            </div>

            <div>
              <h4>
                Roster
              </h4>

              <p>
                View upcoming shifts
              </p>
            </div>

            <button
              type="button"
              className="dashboard-row-action"
              onClick={() => {
                handlePageChange(
                  "Roster"
                );
              }}
            >
              Open
            </button>
          </div>

          <div className="dashboard-schedule-row">
            <div className="schedule-circle">
              <CircleCheck size={17} />
            </div>

            <div>
              <h4>
                Settings
              </h4>

              <p>
                Manage your account
              </p>
            </div>

            <button
              type="button"
              className="dashboard-row-action"
              onClick={() => {
                handlePageChange(
                  "Settings"
                );
              }}
            >
              Open
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-panel recent-events">
        <div className="dashboard-panel-heading recent-heading">
          <h3>
            Recent Clock Events
          </h3>

          <button
            type="button"
            onClick={() => {
              handlePageChange(
                "Clock In/Out"
              );
            }}
          >
            View all
          </button>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>
                  Employee
                </th>

                <th>
                  Type
                </th>

                <th>
                  Time
                </th>

                <th>
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {dashboardData.recentLogs.map(
                (timeLog) => (
                  <tr
                    key={
                      timeLog.timelog_id
                    }
                  >
                    <td>
                      {timeLog.employee_name}
                    </td>

                    <td>
                      <span className="clock-status clock-in">
                        Clock In
                      </span>

                      {timeLog.clock_out && (
                        <>
                          {" "}
                          <span className="clock-status clock-out">
                            Clock Out
                          </span>
                        </>
                      )}
                    </td>

                    <td className="clock-time">
                      {formatClockTime(
                        timeLog.clock_in
                      )}
                    </td>

                    <td>
                      {timeLog.date}
                    </td>
                  </tr>
                )
              )}

              {!dashboardLoading &&
                dashboardData.recentLogs.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="dashboard-empty"
                    >
                      No clock events today.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderPage = () => {
    if (activePage === "Dashboard") {
      return (
        <DashboardHome />
      );
    }

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
      <DashboardHome />
    );
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <Leaf size={22} />
          </div>

          <div>
            <h2>
              Farm Time
            </h2>

            <p>
              Management System
            </p>
          </div>
        </div>

        <nav className="dashboard-nav">
          {visibleNavigationItems.map(
            (item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={
                    activePage === item.label
                      ? "dashboard-nav-item active"
                      : "dashboard-nav-item"
                  }
                  onClick={() => {
                    handlePageChange(
                      item.label
                    );
                  }}
                >
                  <Icon size={18} />

                  <span>
                    {item.label}
                  </span>
                </button>
              );
            }
          )}
        </nav>

        <button
          type="button"
          className="dashboard-nav-item dashboard-logout"
          onClick={onLogout}
        >
          <LogOut size={18} />

          <span>
            Logout
          </span>
        </button>
      </aside>

      <main className="dashboard-main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default Dashboard;