import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  Clock3,
  FileText,
  CalendarDays,
  CreditCard,
  Settings as SettingsIcon,
  Leaf,
  UserRound,
  Sprout,
  CircleCheck,
  Tractor
} from "lucide-react";

import Employees from "./Employees";
import ClockInOut from "./ClockInOut";
import HoursReporting from "./HoursReporting";
import Roster from "./Roster";
import Payroll from "./Payroll";
import Settings from "./Settings";

import "../styles/Dashboard.css";


function Dashboard({ admin, onLogout }) {
  const [activePage, setActivePage] =
    useState("Dashboard");


  const clockEvents = [
    {
      employee: "John Doe",
      type: "Clock In",
      station: "Main Gate",
      time: "07:02 AM"
    },
    {
      employee: "Mary Smith",
      type: "Clock In",
      station: "Packing Shed",
      time: "07:15 AM"
    },
    {
      employee: "Robert Brown",
      type: "Clock In",
      station: "Orchard — Block A",
      time: "07:30 AM"
    },
    {
      employee: "John Doe",
      type: "Clock Out",
      station: "Packing Shed",
      time: "11:15 AM"
    },
    {
      employee: "Linda White",
      type: "Clock Out",
      station: "Administration",
      time: "12:01 PM"
    }
  ];


  function DashboardHome() {
    return (
      <div className="dashboard-home">
        <header className="dashboard-top-header">
          <h1>Dashboard</h1>

          <div className="dashboard-admin">
            <span>
              Welcome, {admin?.full_name || "Admin"}
            </span>

            <div className="admin-circle">
              <UserRound size={18} />
            </div>

            <button
              type="button"
              className="dashboard-logout-button"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-top-cards">
          <div className="dashboard-summary-card">
            <div className="summary-circle">
              <Users size={21} />
            </div>

            <div className="summary-info">
              <p>Employees</p>
              <h2>12</h2>

              <button
                type="button"
                onClick={() =>
                  setActivePage("Employees")
                }
              >
                View employees
              </button>
            </div>
          </div>

          <div className="dashboard-summary-card">
            <div className="summary-circle">
              <CalendarDays size={21} />
            </div>

            <div className="summary-info">
              <p>Upcoming Roster</p>
              <h2>5</h2>

              <button
                type="button"
                onClick={() =>
                  setActivePage("Roster")
                }
              >
                View roster
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-middle">
          <div className="dashboard-panel clocked-panel">
            <div className="dashboard-panel-heading">
              <h3>Clocked In Now</h3>

              <button
                type="button"
                onClick={() =>
                  setActivePage("ClockInOut")
                }
              >
                Clock In/Out
              </button>
            </div>

            <div className="clocked-content">
              <div className="clocked-icon">
                <Clock3 size={25} />
              </div>

              <div>
                <h2>8</h2>
                <p>of 12 staff clocked in</p>
                <span>4 yet to start shift</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel schedules-panel">
            <div className="dashboard-panel-heading schedules-heading">
              <h3>Upcoming Schedules</h3>

              <button
                type="button"
                onClick={() =>
                  setActivePage("Roster")
                }
              >
                View all
              </button>
            </div>

            <div className="dashboard-schedule-row">
              <div className="schedule-circle">
                <Sprout size={17} />
              </div>

              <div>
                <h4>Irrigation — Block B</h4>
                <p>Today · 2:00 PM</p>
              </div>
            </div>

            <div className="dashboard-schedule-row">
              <div className="schedule-circle">
                <CircleCheck size={17} />
              </div>

              <div>
                <h4>Fertilizer Application</h4>
                <p>Tomorrow · 9:00 AM</p>
              </div>
            </div>

            <div className="dashboard-schedule-row">
              <div className="schedule-circle">
                <Tractor size={17} />
              </div>

              <div>
                <h4>Harvest — Orchard A</h4>
                <p>Thu 19 Sep · 7:00 AM</p>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-panel recent-events">
          <div className="dashboard-panel-heading recent-heading">
            <h3>Recent Clock Events</h3>

            <button
              type="button"
              onClick={() =>
                setActivePage("ClockInOut")
              }
            >
              View all
            </button>
          </div>

          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Station</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {clockEvents.map((event, index) => (
                  <tr key={`${event.employee}-${index}`}>
                    <td>{event.employee}</td>

                    <td>
                      <span
                        className={
                          event.type === "Clock In"
                            ? "clock-status clock-in"
                            : "clock-status clock-out"
                        }
                      >
                        {event.type}
                      </span>
                    </td>

                    <td>{event.station}</td>

                    <td className="clock-time">
                      {event.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }


  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <Leaf size={22} />
          </div>

          <div>
            <h2>Farm Time</h2>
            <p>Management System</p>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "Dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Dashboard")
            }
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "Employees"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Employees")
            }
          >
            <Users size={18} />
            <span>Employees</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "ClockInOut"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("ClockInOut")
            }
          >
            <Clock3 size={18} />
            <span>Clock In/Out</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "HoursReporting"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("HoursReporting")
            }
          >
            <FileText size={18} />
            <span>Hours Reporting</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "Roster"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Roster")
            }
          >
            <CalendarDays size={18} />
            <span>Roster</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "Payroll"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Payroll")
            }
          >
            <CreditCard size={18} />
            <span>Payroll</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activePage === "Settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Settings")
            }
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="dashboard-sidebar-logout">
          <button
            type="button"
            className="dashboard-nav-item"
            onClick={onLogout}
          >
            <UserRound size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main-content">
        {activePage === "Dashboard" && (
          <DashboardHome />
        )}

        {activePage === "Employees" && (
          <Employees />
        )}

        {activePage === "ClockInOut" && (
          <ClockInOut />
        )}

        {activePage === "HoursReporting" && (
          <HoursReporting />
        )}

        {activePage === "Roster" && (
          <Roster />
        )}

        {activePage === "Payroll" && (
          <Payroll />
        )}

        {activePage === "Settings" && (
          <Settings />
        )}
      </main>
    </div>
  );
}


export default Dashboard;