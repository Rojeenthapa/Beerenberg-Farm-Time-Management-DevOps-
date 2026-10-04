import {
  useEffect,
  useState
} from "react";

import {
  Clock3,
  Coffee,
  FileText,
  Timer
} from "lucide-react";

import {
  apiRequest,
  getStoredUser
} from "../api";

import "../styles/HoursReporting.css";

function HoursReporting() {
  const currentUser = getStoredUser();

  const isAdmin = Boolean(
    currentUser?.is_admin
  );

  const getInitialFromDate = () => {
    const date = new Date();

    date.setDate(
      date.getDate() - 13
    );

    return date
      .toISOString()
      .slice(0, 10);
  };

  const getInitialToDate = () => {
    return new Date()
      .toISOString()
      .slice(0, 10);
  };

  const [fromDate, setFromDate] =
    useState(getInitialFromDate);

  const [toDate, setToDate] =
    useState(getInitialToDate);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [employees, setEmployees] =
    useState([]);

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [loadingEmployees, setLoadingEmployees] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    setLoadingEmployees(true);

    try {
      const data = await apiRequest(
        "/employees?status=Active"
      );

      setEmployees(data);

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadReport = async () => {
    if (!fromDate || !toDate) {
      setError(
        "Please select both dates."
      );
      return;
    }

    if (toDate < fromDate) {
      setError(
        "The end date cannot be before the start date."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        from_date: fromDate,
        to_date: toDate
      });

      if (
        isAdmin &&
        selectedEmployeeId
      ) {
        params.set(
          "employee_id",
          selectedEmployeeId
        );
      }

      const data = await apiRequest(
        `/hours?${params.toString()}`
      );

      setReport(data);

    } catch (requestError) {
      setError(
        requestError.message
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hours-reporting-page">
      <div className="hours-header">
        <div>
          <h1>
            Hours Reporting
          </h1>

          <p>
            Review worked hours and break time.
          </p>
        </div>

        <div className="admin-area">
          <span>
            {currentUser?.first_name}{" "}
            {currentUser?.last_name}
          </span>
        </div>
      </div>

      <section className="filter-card">
        <div className="filter-field">
          <label htmlFor="fromDate">
            From Date
          </label>

          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(
                event.target.value
              );
            }}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="toDate">
            To Date
          </label>

          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(
                event.target.value
              );
            }}
          />
        </div>

        {isAdmin && (
          <div className="filter-field">
            <label htmlFor="staff">
              Staff
            </label>

            <select
              id="staff"
              value={selectedEmployeeId}
              onChange={(event) => {
                setSelectedEmployeeId(
                  event.target.value
                );
              }}
              disabled={loadingEmployees}
            >
              <option value="">
                All Staff
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.employee_id}
                  value={employee.employee_id}
                >
                  {employee.display_id} —{" "}
                  {employee.first_name}{" "}
                  {employee.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="view-hours-btn"
          onClick={loadReport}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "View Hours"}
        </button>
      </section>

      {error && (
        <div className="hours-error">
          {error}
        </div>
      )}

      {report && (
        <>
          <section className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <span>
                  Total Hours
                </span>

                <h2>
                  {report.total_hours_display}
                </h2>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <Timer size={22} />
              </div>

              <div>
                <span>
                  Worked Hours
                </span>

                <h2>
                  {report.total_regular_hours_display}
                </h2>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <Coffee size={22} />
              </div>

              <div>
                <span>
                  Break Time
                </span>

                <h2>
                  {report.total_break_hours_display}
                </h2>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <FileText size={22} />
              </div>

              <div>
                <span>
                  Staff Members
                </span>

                <h2>
                  {report.employees.length}
                </h2>
              </div>
            </div>
          </section>

          <section className="hours-table-card">
            <div className="hours-table-heading">
              <div>
                <h3>
                  Hours Summary
                </h3>

                <p>
                  {report.from_date}
                  {" to "}
                  {report.to_date}
                </p>
              </div>
            </div>

            <div className="hours-table-wrapper">
              <table className="hours-table">
                <thead>
                  <tr>
                    <th>
                      Staff
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Regular Hours
                    </th>

                    <th>
                      Break Time
                    </th>

                    <th>
                      Total Hours
                    </th>

                    <th>
                      Records
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.employees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.employee_id
                        }
                      >
                        <td>
                          <div className="employee-name">
                            {employee.employee_name}
                          </div>

                          <div className="employee-id">
                            {employee.display_id}
                          </div>
                        </td>

                        <td>
                          {employee.role}
                        </td>

                        <td>
                          {employee.regular_hours_display}
                        </td>

                        <td className="break-time">
                          {employee.break_hours_display}
                        </td>

                        <td>
                          <span className="total-hours-badge">
                            {employee.total_hours_display}
                          </span>
                        </td>

                        <td>
                          {employee.completed_log_count}
                        </td>
                      </tr>
                    )
                  )}

                  {report.employees.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="no-hours"
                      >
                        No hours found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="hours-table-footer">
              {report.employees.length} staff member
              {report.employees.length === 1
                ? ""
                : "s"}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default HoursReporting;