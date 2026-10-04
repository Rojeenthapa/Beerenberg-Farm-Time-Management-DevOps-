import {
  useEffect,
  useState
} from "react";

import {
  apiRequest
} from "../api";

import "../styles/HoursReporting.css";


function HoursReporting({
  currentUser
}) {
  const [fromDate, setFromDate] =
    useState("2026-09-21");

  const [toDate, setToDate] =
    useState("2026-10-04");

  const [report, setReport] =
    useState(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set(
        "from_date",
        fromDate
      );

      params.set(
        "to_date",
        toDate
      );

      const response = await apiRequest(
        `/hours?${params.toString()}`
      );

      setReport(response);

    } catch (requestError) {
      setError(
        requestError.message
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReport();
  }, []);


  return (
    <section className="hours-page">
      <div className="page-header">
        <div>
          <h1>
            Hours Reporting
          </h1>

          <p>
            Review completed work hours and breaks.
          </p>
        </div>
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="report-filters">
        <label>
          From
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(
                event.target.value
              );
            }}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(
                event.target.value
              );
            }}
          />
        </label>

        <button
          type="button"
          className="primary-button"
          disabled={loading}
          onClick={loadReport}
        >
          {loading
            ? "Loading..."
            : "View Hours"}
        </button>
      </div>

      {report && (
        <div className="data-card">
          <div className="report-total">
            <span>
              Total Hours
            </span>

            <strong>
              {report.total_hours_display}
            </strong>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Employee
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Total Hours
                  </th>

                  <th>
                    Break Hours
                  </th>

                  <th>
                    Completed Logs
                  </th>

                  <th>
                    Open Logs
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
                        {employee.employee_name}
                      </td>

                      <td>
                        {employee.role}
                      </td>

                      <td>
                        {employee.total_hours_display}
                      </td>

                      <td>
                        {employee.break_hours_display}
                      </td>

                      <td>
                        {employee.completed_log_count}
                      </td>

                      <td>
                        {employee.open_log_count}
                      </td>
                    </tr>
                  )
                )}

                {report.employees.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="empty-row"
                    >
                      No hour records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}


export default HoursReporting;