import { useState } from "react";
import "../styles/HoursReporting.css";

function HoursReporting() {
  const [staff, setStaff] = useState("All Staff");
  const [fromDate, setFromDate] = useState("2026-09-15");
  const [toDate, setToDate] = useState("2026-09-27");

  const employees = [
    {
      id: "EMP-001",
      name: "John Doe",
      role: "Field Supervisor",
      regularHours: "38h 00m",
      breakTime: "2h 30m",
      totalHours: "40h 30m",
    },
    {
      id: "EMP-002",
      name: "Mary Smith",
      role: "Irrigation Technician",
      regularHours: "36h 00m",
      breakTime: "2h 30m",
      totalHours: "38h 30m",
    },
    {
      id: "EMP-003",
      name: "Robert Brown",
      role: "Seasonal Labourer",
      regularHours: "22h 30m",
      breakTime: "1h 15m",
      totalHours: "23h 45m",
    },
    {
      id: "EMP-004",
      name: "Linda White",
      role: "Pest Control Officer",
      regularHours: "18h 00m",
      breakTime: "1h 00m",
      totalHours: "19h 00m",
    },
    {
      id: "EMP-005",
      name: "David Green",
      role: "Harvest Coordinator",
      regularHours: "40h 00m",
      breakTime: "2h 30m",
      totalHours: "42h 30m",
    },
  ];

  const handleViewHours = () => {
    console.log("Staff:", staff);
    console.log("From:", fromDate);
    console.log("To:", toDate);
  };

  return (
    <div className="hours-reporting-page">

      {/* HEADER */}
      <div className="hours-header">
        <h1>Hours Reporting</h1>

        <div className="admin-area">
          <span>Welcome, Admin</span>
          <div className="admin-icon">♙</div>
        </div>
      </div>

      {/* FILTERS */}
      <section className="filter-card">

        <div className="filter-field">
          <label htmlFor="staff">Staff</label>

          <select
            id="staff"
            value={staff}
            onChange={(e) => setStaff(e.target.value)}
          >
            <option>All Staff</option>
            <option>John Doe</option>
            <option>Mary Smith</option>
            <option>Robert Brown</option>
            <option>Linda White</option>
            <option>David Green</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="fromDate">From Date</label>

          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="toDate">To Date</label>

          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="view-hours-btn"
          onClick={handleViewHours}
        >
          View Hours
        </button>

      </section>

      {/* SUMMARY CARDS */}
      <section className="summary-cards">

        <div className="summary-card">
          <div className="summary-icon">◷</div>

          <div>
            <span>Total Hours</span>
            <h2>164h 15m</h2>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">✓</div>

          <div>
            <span>Regular Hours</span>
            <h2>154h 30m</h2>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">☕</div>

          <div>
            <span>Break Time</span>
            <h2>9h 45m</h2>
          </div>
        </div>

      </section>

      {/* HOURS TABLE */}
      <section className="hours-table-card">

        <h3>Hours Summary</h3>

        <div className="hours-table-wrapper">

          <table className="hours-table">

            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Regular Hours</th>
                <th>Break Time</th>
                <th>Total Hours</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>

                  <td>
                    <div className="employee-name">
                      {employee.name}
                    </div>

                    <div className="employee-id">
                      {employee.id}
                    </div>
                  </td>

                  <td>{employee.role}</td>

                  <td>{employee.regularHours}</td>

                  <td className="break-time">
                    {employee.breakTime}
                  </td>

                  <td>
                    <span className="total-hours-badge">
                      {employee.totalHours}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

        <div className="table-footer">
          {employees.length} staff members · {fromDate} to {toDate}
        </div>

      </section>

    </div>
  );
}

export default HoursReporting;