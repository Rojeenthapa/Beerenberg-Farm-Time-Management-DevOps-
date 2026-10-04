import {
  useEffect,
  useState
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users
} from "lucide-react";

import {
  apiRequest
} from "../api";

import Employees from "./Employees";
import ClockInOut from "./ClockInOut";
import HoursReporting from "./HoursReporting";
import Payroll from "./Payroll";
import Roster from "./Roster";
import SettingsPage from "./Settings";

import "../styles/Dashboard.css";


function Dashboard({
  currentUser,
  onLogout
}) {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [dashboardData, setDashboardData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const isAdmin = Boolean(
    currentUser?.is_admin
  );


  const allNavigationItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      label: "Employees",
      icon: Users,
      adminOnly: true
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
      icon: CreditCard,
      adminOnly: true
    },
    {
      label: "Settings",
      icon: Settings
    }
  ];


  const navigationItems =
    allNavigationItems.filter((item) => {
      if (item.adminOnly) {
        return isAdmin;
      }

      return true;
    });


  const loadAdminDashboard = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        employeeResponse,
        payrollResponse,
        exceptionResponse
      ] = await Promise.all([
        apiRequest(
          "/dashboard/employee-count"
        ),
        apiRequest(
          "/payroll?period_start=2026-09-21&period_end=2026-10-04"
        ),
        apiRequest(
          "/compliance/exceptions?status=Open"
        )
      ]);

      setDashboardData({
        employeeCount:
          employeeResponse.employee_count || 0,
        payroll: payrollResponse,
        openExceptions:
          Array.isArray(
            exceptionResponse
          )
            ? exceptionResponse.length
            : 0
      });

    } catch (requestError) {
      setError(
        requestError.message
      );

    } finally {
      setLoading(false);
    }
  };


  const loadEmployeeDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        timeLogResponse,
        shiftResponse,
        hoursResponse
      ] = await Promise.all([
        apiRequest(
          `/timelogs?employee_id=${currentUser.employee_id}`
        ),
        apiRequest(
          `/shifts?employee_id=${currentUser.employee_id}`
        ),
        apiRequest(
          `/hours?from_date=2026-09-21&to_date=2026-10-04&employee_id=${currentUser.employee_id}`
        )
      ]);

      const timeLogs = Array.isArray(
        timeLogResponse
      )
        ? timeLogResponse
        : [];

      const shifts = Array.isArray(
        shiftResponse
      )
        ? shiftResponse
        : [];

      setDashboardData({
        activeTimeLog:
          timeLogs.find(
            (log) => !log.clock_out
          ) || null,
        shifts: shifts.slice(0, 5),
        hours: hoursResponse
      });

    } catch (requestError) {
      setError(
        requestError.message
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (isAdmin) {
      loadAdminDashboard();
    } else {
      loadEmployeeDashboard();
    }
  }, [
    isAdmin,
    currentUser?.employee_id
  ]);


  const goToPage = (page) => {
    setActivePage(page);
  };


  const renderAdminHome = () => {
    const payroll = dashboardData?.payroll;

    return (
      <section className="dashboard-home">
        <div className="dashboard-page-heading">
          <div>
            <h1>
              Admin Dashboard
            </h1>

            <p>
              Monitor staff, attendance, payroll, and compliance.
            </p>
          </div>

          <div className="dashboard-user">
            Welcome,{" "}
            {currentUser?.first_name || "Administrator"}
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <div className="dashboard-summary-grid">
          <button
            type="button"
            className="dashboard-summary-card"
            onClick={() => {
              goToPage("Employees");
            }}
          >
            <div className="dashboard-summary-icon">
              <Users size={23} />
            </div>

            <div>
              <span>
                Active employees
              </span>

              <strong>
                {loading
                  ? "Loading..."
                  : dashboardData?.employeeCount || 0}
              </strong>

              <small>
                Manage employee records
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-summary-card"
            onClick={() => {
              goToPage("Hours Reporting");
            }}
          >
            <div className="dashboard-summary-icon">
              <Clock3 size={23} />
            </div>

            <div>
              <span>
                Total hours
              </span>

              <strong>
                {loading
                  ? "Loading..."
                  : payroll?.total_hours_display || "0h 00m"}
              </strong>

              <small>
                Current payroll period
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-summary-card"
            onClick={() => {
              goToPage("Payroll");
            }}
          >
            <div className="dashboard-summary-icon">
              <CreditCard size={23} />
            </div>

            <div>
              <span>
                Gross payroll
              </span>

              <strong>
                {loading
                  ? "Loading..."
                  : payroll?.total_gross_pay_display || "$0.00"}
              </strong>

              <small>
                View payroll summary
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-summary-card warning-card"
            onClick={() => {
              goToPage("Settings");
            }}
          >
            <div className="dashboard-summary-icon warning-icon">
              <AlertTriangle size={23} />
            </div>

            <div>
              <span>
                Open exceptions
              </span>

              <strong>
                {loading
                  ? "Loading..."
                  : dashboardData?.openExceptions || 0}
              </strong>

              <small>
                Review compliance issues
              </small>
            </div>
          </button>
        </div>

        <div className="dashboard-panel-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  Admin actions
                </h2>

                <p>
                  Common management tasks.
                </p>
              </div>
            </div>

            <div className="dashboard-action-grid">
              <button
                type="button"
                onClick={() => {
                  goToPage("Employees");
                }}
              >
                <Users size={19} />
                Manage Employees
              </button>

              <button
                type="button"
                onClick={() => {
                  goToPage("Roster");
                }}
              >
                <CalendarDays size={19} />
                Manage Roster
              </button>

              <button
                type="button"
                onClick={() => {
                  goToPage("Payroll");
                }}
              >
                <CreditCard size={19} />
                Generate Payroll
              </button>

              <button
                type="button"
                onClick={() => {
                  goToPage("Hours Reporting");
                }}
              >
                <FileText size={19} />
                Review Hours
              </button>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  Payroll period
                </h2>

                <p>
                  21 September 2026 – 4 October 2026
                </p>
              </div>

              <CheckCircle2
                size={22}
                className="success-icon"
              />
            </div>

            <div className="dashboard-payroll-info">
              <div>
                <span>
                  Employees included
                </span>

                <strong>
                  {payroll?.employees?.length || 0}
                </strong>
              </div>

              <div>
                <span>
                  Total payroll
                </span>

                <strong>
                  {payroll?.total_gross_pay_display || "$0.00"}
                </strong>
              </div>
            </div>
          </section>
        </div>
      </section>
    );
  };


  const renderEmployeeHome = () => {
    const activeTimeLog =
      dashboardData?.activeTimeLog;

    const shifts =
      dashboardData?.shifts || [];

    const hours =
      dashboardData?.hours;

    return (
      <section className="dashboard-home">
        <div className="dashboard-page-heading">
          <div>
            <h1>
              My Dashboard
            </h1>

            <p>
              View your attendance, roster, and work hours.
            </p>
          </div>

          <div className="dashboard-user">
            Welcome,{" "}
            {currentUser?.first_name || "Employee"}
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <div className="dashboard-summary-grid employee-summary-grid">
          <button
            type="button"
            className="dashboard-summary-card"
            onClick={() => {
              goToPage("Clock In/Out");
            }}
          >
            <div className="dashboard-summary-icon">
              <Clock3 size={23} />
            </div>

            <div>
              <span>
                Attendance status
              </span>

              <strong>
                {activeTimeLog
                  ? "Clocked in"
                  : "Clocked out"}
              </strong>

              <small>
                Open attendance page
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-summary-card"
            onClick={() => {
              goToPage("Hours Reporting");
            }}
          >
            <div className="dashboard-summary-icon">
              <FileText size={23} />
            </div>

            <div>
              <span>
                Current hours
              </span>

              <strong>
                {hours?.total_hours_display || "0h 00m"}
              </strong>

              <small>
                Review this pay period
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-summary-card"
            onClick={() => {
              goToPage("Roster");
            }}
          >
            <div className="dashboard-summary-icon">
              <CalendarDays size={23} />
            </div>

            <div>
              <span>
                Upcoming shifts
              </span>

              <strong>
                {shifts.length}
              </strong>

              <small>
                View your roster
              </small>
            </div>
          </button>
        </div>

        <div className="dashboard-panel-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  Quick actions
                </h2>

                <p>
                  Manage your working day.
                </p>
              </div>
            </div>

            <div className="dashboard-action-grid">
              <button
                type="button"
                onClick={() => {
                  goToPage("Clock In/Out");
                }}
              >
                <Clock3 size={19} />
                Clock In / Out
              </button>

              <button
                type="button"
                onClick={() => {
                  goToPage("Roster");
                }}
              >
                <CalendarDays size={19} />
                View Roster
              </button>

              <button
                type="button"
                onClick={() => {
                  goToPage("Hours Reporting");
                }}
              >
                <FileText size={19} />
                View My Hours
              </button>

              <button
                type="button"
                onClick={() => {
                  goToPage("Settings");
                }}
              >
                <Settings size={19} />
                Account Settings
              </button>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  Upcoming shifts
                </h2>

                <p>
                  Your scheduled work.
                </p>
              </div>
            </div>

            <div className="dashboard-shifts-list">
              {shifts.length === 0 && (
                <p className="dashboard-empty">
                  No upcoming shifts found.
                </p>
              )}

              {shifts.map((shift) => (
                <div
                  className="dashboard-shift-row"
                  key={shift.shift_id}
                >
                  <CalendarDays size={17} />

                  <div>
                    <strong>
                      {shift.date}
                    </strong>

                    <span>
                      {shift.start_time}
                      {" – "}
                      {shift.end_time}
                    </span>
                  </div>

                  <small>
                    {shift.status}
                  </small>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    );
  };


  const renderHome = () => {
    if (isAdmin) {
      return renderAdminHome();
    }

    return renderEmployeeHome();
  };


  const renderPage = () => {
    if (
      activePage === "Employees" &&
      !isAdmin
    ) {
      return renderEmployeeHome();
    }

    if (
      activePage === "Payroll" &&
      !isAdmin
    ) {
      return renderEmployeeHome();
    }

    switch (activePage) {
      case "Employees":
        return (
          <Employees
            currentUser={currentUser}
          />
        );

      case "Clock In/Out":
        return (
          <ClockInOut
            currentUser={currentUser}
          />
        );

      case "Hours Reporting":
        return (
          <HoursReporting
            currentUser={currentUser}
          />
        );

      case "Roster":
        return (
          <Roster
            currentUser={currentUser}
          />
        );

      case "Payroll":
        return (
          <Payroll
            currentUser={currentUser}
          />
        );

      case "Settings":
        return (
          <SettingsPage
            currentUser={currentUser}
          />
        );

      default:
        return renderHome();
    }
  };


  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <span>
              🌿
            </span>
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
          {navigationItems.map(
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
                    setActivePage(
                      item.label
                    );
                  }}
                >
                  <Icon size={17} />

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
          <LogOut size={17} />

          <span>
            Logout
          </span>
        </button>
      </aside>

      <main className="dashboard-main">
        {renderPage()}
      </main>
    </div>
  );
}


export default Dashboard;