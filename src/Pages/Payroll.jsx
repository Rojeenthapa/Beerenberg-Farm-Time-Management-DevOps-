import { useState } from "react";
import { CreditCard, Eye, X, UserRound } from "lucide-react";
import "../styles/Payroll.css";

function Payroll() {
  const [payPeriod, setPayPeriod] = useState("Sep 15 – Sep 27, 2026");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const employees = [
    {
      id: "EMP-001",
      name: "John Doe",
      totalHours: "40h 30m",
      standardRate: "$28.00/hr",
      overtimeRate: "$42.00/hr",
      grossPay: "$1,134.00",
    },
    {
      id: "EMP-002",
      name: "Mary Smith",
      totalHours: "38h 30m",
      standardRate: "$22.50/hr",
      overtimeRate: "$33.75/hr",
      grossPay: "$866.25",
    },
    {
      id: "EMP-003",
      name: "Robert Brown",
      totalHours: "23h 45m",
      standardRate: "$18.00/hr",
      overtimeRate: "$27.00/hr",
      grossPay: "$427.50",
    },
    {
      id: "EMP-004",
      name: "Linda White",
      totalHours: "19h 00m",
      standardRate: "$24.00/hr",
      overtimeRate: "$36.00/hr",
      grossPay: "$456.00",
    },
    {
      id: "EMP-005",
      name: "David Green",
      totalHours: "42h 30m",
      standardRate: "$31.00/hr",
      overtimeRate: "$46.50/hr",
      grossPay: "$1,317.50",
    },
  ];

  const handleGenerateReport = () => {
    console.log("Generating payroll report for:", payPeriod);
  };

  return (
    <div className="payroll-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <div className="payroll-header">
        <h1>Payroll</h1>

        <div className="payroll-admin">
          <span>Welcome, Admin</span>

          <div className="payroll-admin-icon">
            <UserRound size={17} />
          </div>
        </div>
      </div>

      {/* =====================================
          PAY PERIOD
      ===================================== */}

      <section className="payroll-filter-card">
        <div className="payroll-filter-field">
          <label htmlFor="payPeriod">Pay Period</label>

          <select
            id="payPeriod"
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
          >
            <option>Sep 15 – Sep 27, 2026</option>
            <option>Sep 1 – Sep 14, 2026</option>
            <option>Aug 18 – Aug 31, 2026</option>
            <option>Aug 4 – Aug 17, 2026</option>
          </select>
        </div>

        <button
          type="button"
          className="generate-report-btn"
          onClick={handleGenerateReport}
        >
          Generate Report
        </button>
      </section>

      {/* =====================================
          TOTAL PAYROLL CARD
      ===================================== */}

      <section className="payroll-total-section">
        <div className="payroll-total-card">
          <div className="payroll-total-icon">
            <CreditCard size={22} />
          </div>

          <div>
            <p>Total Payroll This Period</p>

            <h2>$4,201.25</h2>

            <span>Sep 15 – Sep 27, 2026</span>
          </div>
        </div>
      </section>

      {/* =====================================
          PAYROLL SUMMARY
      ===================================== */}

      <section className="payroll-table-card">
        <div className="payroll-table-title">
          <h3>Payroll Summary</h3>
        </div>

        <div className="payroll-table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Total Hours</th>
                <th>Standard Pay Rate</th>
                <th>Overtime Pay Rate</th>
                <th>Gross Pay</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="payroll-employee-id">
                    {employee.id}
                  </td>

                  <td className="payroll-employee-name">
                    {employee.name}
                  </td>

                  <td>{employee.totalHours}</td>

                  <td>{employee.standardRate}</td>

                  <td>{employee.overtimeRate}</td>

                  <td>
                    <span className="gross-pay-badge">
                      {employee.grossPay}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="view-payroll-btn"
                      aria-label={`View payroll for ${employee.name}`}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="payroll-table-footer">
          <span>{employees.length} employees</span>

          <span>
            Total: <strong>$4,201.25</strong>
          </span>
        </div>
      </section>

      {/* =====================================
          EMPLOYEE PAYROLL DETAILS MODAL
      ===================================== */}

      {selectedEmployee && (
        <div className="payroll-modal-overlay">
          <div className="payroll-modal">
            <div className="payroll-modal-header">
              <div>
                <h2>Payroll Details</h2>
                <p>{selectedEmployee.name}</p>
              </div>

              <button
                type="button"
                className="payroll-modal-close"
                onClick={() => setSelectedEmployee(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="payroll-detail-row">
              <span>Employee ID</span>
              <strong>{selectedEmployee.id}</strong>
            </div>

            <div className="payroll-detail-row">
              <span>Total Hours</span>
              <strong>{selectedEmployee.totalHours}</strong>
            </div>

            <div className="payroll-detail-row">
              <span>Standard Pay Rate</span>
              <strong>{selectedEmployee.standardRate}</strong>
            </div>

            <div className="payroll-detail-row">
              <span>Overtime Pay Rate</span>
              <strong>{selectedEmployee.overtimeRate}</strong>
            </div>

            <div className="payroll-detail-row payroll-detail-total">
              <span>Gross Pay</span>
              <strong>{selectedEmployee.grossPay}</strong>
            </div>

            <button
              type="button"
              className="payroll-modal-done"
              onClick={() => setSelectedEmployee(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payroll;