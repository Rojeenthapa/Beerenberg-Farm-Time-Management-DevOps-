import {
  useEffect,
  useState
} from "react";

import {
  CreditCard,
  Eye,
  UserRound,
  X
} from "lucide-react";

import {
  apiRequest
} from "../api";

import "../styles/Payroll.css";


function Payroll({
  currentUser
}) {
  const [periodStart, setPeriodStart] =
    useState("2026-09-21");

  const [periodEnd, setPeriodEnd] =
    useState("2026-10-04");

  const [employees, setEmployees] =
    useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const isAdmin = Boolean(
    currentUser?.is_admin
  );


  const loadEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const response = await apiRequest(
        "/employees?status=Active"
      );

      setEmployees(
        Array.isArray(response)
          ? response
          : []
      );

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  };


  const loadPayroll = async () => {
    if (!periodStart || !periodEnd) {
      setError(
        "Both payroll dates are required."
      );

      return;
    }

    if (periodEnd < periodStart) {
      setError(
        "The end date cannot be before the start date."
      );

      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const params = new URLSearchParams();

      params.set(
        "period_start",
        periodStart
      );

      params.set(
        "period_end",
        periodEnd
      );

      if (
        isAdmin &&
        selectedEmployeeId
      ) {
        params.set(
          "employee_id",
          selectedEmployeeId
        );
      }

      const response = await apiRequest(
        `/payroll?${params.toString()}`
      );

      setReport(response);

    } catch (requestError) {
      setError(
        requestError.message
      );

      setReport(null);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadEmployees();
    loadPayroll();
  }, []);


  const handleGeneratePayroll = async () => {
    if (!isAdmin) {
      return;
    }

    setGenerating(true);
    setError("");
    setSuccessMessage("");

    try {
      await apiRequest(
        "/payroll/generate",
        {
          method: "POST",
          body: JSON.stringify({
            period_start: periodStart,
            period_end: periodEnd,
            employee_id:
              selectedEmployeeId
                ? Number(
                    selectedEmployeeId
                  )
                : null
          })
        }
      );

      setSuccessMessage(
        "Payroll generated successfully."
      );

      await loadPayroll();

    } catch (requestError) {
      setError(
        requestError.message
      );

    } finally {
      setGenerating(false);
    }
  };


  return (
    <section className="payroll-page">
      <div className="payroll-header">
        <div>
          <h1>
            Payroll
          </h1>

          <p>
            Calculate payroll from approved time logs.
          </p>
        </div>

        <div className="payroll-admin">
          <span>
            Welcome,{" "}
            {currentUser?.first_name || "User"}
          </span>

          <div className="payroll-admin-icon">
            <UserRound size={17} />
          </div>
        </div>
      </div>

      <section className="payroll-filter-card">
        <div className="payroll-filter-field">
          <label htmlFor="periodStart">
            Period Start
          </label>

          <input
            id="periodStart"
            type="date"
            value={periodStart}
            onChange={(event) => {
              setPeriodStart(
                event.target.value
              );
            }}
          />
        </div>

        <div className="payroll-filter-field">
          <label htmlFor="periodEnd">
            Period End
          </label>

          <input
            id="periodEnd"
            type="date"
            value={periodEnd}
            onChange={(event) => {
              setPeriodEnd(
                event.target.value
              );
            }}
          />
        </div>

        {isAdmin && (
          <div className="payroll-filter-field">
            <label htmlFor="payrollEmployee">
              Employee
            </label>

            <select
              id="payrollEmployee"
              value={selectedEmployeeId}
              onChange={(event) => {
                setSelectedEmployeeId(
                  event.target.value
                );
              }}
            >
              <option value="">
                All Employees
              </option>

              {employees.map((employee) => (
                <option
                  key={
                    employee.employee_id
                  }
                  value={
                    employee.employee_id
                  }
                >
                  {employee.display_id}
                  {" — "}
                  {employee.first_name}
                  {" "}
                  {employee.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="generate-report-btn"
          disabled={loading}
          onClick={loadPayroll}
        >
          {loading
            ? "Loading..."
            : "View Payroll"}
        </button>

        {isAdmin && (
          <button
            type="button"
            className="generate-report-btn"
            disabled={generating}
            onClick={handleGeneratePayroll}
          >
            {generating
              ? "Generating..."
              : "Generate Payroll"}
          </button>
        )}
      </section>

      {error && (
        <div className="payroll-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="payroll-success">
          {successMessage}
        </div>
      )}

      {report && (
        <>
          <section className="payroll-total-section">
            <div className="payroll-total-card">
              <div className="payroll-total-icon">
                <CreditCard size={22} />
              </div>

              <div>
                <p>
                  Total Payroll This Period
                </p>

                <h2>
                  {report.total_gross_pay_display}
                </h2>

                <span>
                  {report.period_start}
                  {" to "}
                  {report.period_end}
                </span>
              </div>
            </div>
          </section>

          <section className="payroll-table-card">
            <div className="payroll-table-title">
              <h3>
                Payroll Summary
              </h3>
            </div>

            <div className="payroll-table-wrapper">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>
                      Employee ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Total Hours
                    </th>

                    <th>
                      Standard Pay Rate
                    </th>

                    <th>
                      Overtime Pay Rate
                    </th>

                    <th>
                      Gross Pay
                    </th>

                    <th>
                      Action
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
                          {employee.display_id}
                        </td>

                        <td>
                          {employee.employee_name}
                        </td>

                        <td>
                          {employee.total_hours_display}
                        </td>

                        <td>
                          $
                          {Number(
                            employee.regular_rate
                          ).toFixed(2)}
                          /hr
                        </td>

                        <td>
                          $
                          {Number(
                            employee.overtime_rate
                          ).toFixed(2)}
                          /hr
                        </td>

                        <td>
                          <span className="gross-pay-badge">
                            {employee.gross_pay_display}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="view-payroll-btn"
                            onClick={() => {
                              setSelectedEmployee(
                                employee
                              );
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                  {report.employees.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="no-payroll"
                      >
                        No payroll records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="payroll-table-footer">
              {report.employees.length} employee
              {report.employees.length === 1
                ? ""
                : "s"}
            </div>
          </section>
        </>
      )}

      {selectedEmployee && (
        <div className="payroll-modal-overlay">
          <div className="payroll-modal">
            <div className="payroll-modal-header">
              <div>
                <h2>
                  Payroll Details
                </h2>

                <p>
                  {selectedEmployee.employee_name}
                </p>
              </div>

              <button
                type="button"
                className="payroll-modal-close"
                onClick={() => {
                  setSelectedEmployee(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="payroll-detail-row">
              <span>
                Total Hours
              </span>

              <strong>
                {selectedEmployee.total_hours_display}
              </strong>
            </div>

            <div className="payroll-detail-row">
              <span>
                Regular Hours
              </span>

              <strong>
                {Number(
                  selectedEmployee.regular_hours
                ).toFixed(2)}
              </strong>
            </div>

            <div className="payroll-detail-row">
              <span>
                Overtime Hours
              </span>

              <strong>
                {Number(
                  selectedEmployee.overtime_hours
                ).toFixed(2)}
              </strong>
            </div>

            <div className="payroll-detail-row">
              <span>
                Regular Pay
              </span>

              <strong>
                $
                {Number(
                  selectedEmployee.regular_pay
                ).toFixed(2)}
              </strong>
            </div>

            <div className="payroll-detail-row">
              <span>
                Overtime Pay
              </span>

              <strong>
                $
                {Number(
                  selectedEmployee.overtime_pay
                ).toFixed(2)}
              </strong>
            </div>

            <div className="payroll-detail-row payroll-detail-total">
              <span>
                Gross Pay
              </span>

              <strong>
                {selectedEmployee.gross_pay_display}
              </strong>
            </div>

            <button
              type="button"
              className="payroll-modal-done"
              onClick={() => {
                setSelectedEmployee(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}


export default Payroll;