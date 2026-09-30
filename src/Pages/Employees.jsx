import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import "../styles/Employees.css";

function Employees() {
  const [search, setSearch] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const [employees, setEmployees] = useState([
    {
      id: "EMP-001",
      name: "John Doe",
      role: "Field Supervisor",
      contract: "Full Time",
      payRate: "$28.00/hr",
      status: "Active",
    },
    {
      id: "EMP-002",
      name: "Mary Smith",
      role: "Irrigation Technician",
      contract: "Full Time",
      payRate: "$22.50/hr",
      status: "Active",
    },
    {
      id: "EMP-003",
      name: "Robert Brown",
      role: "Seasonal Labourer",
      contract: "Casual",
      payRate: "$18.00/hr",
      status: "Active",
    },
    {
      id: "EMP-004",
      name: "Linda White",
      role: "Pest Control Officer",
      contract: "Part Time",
      payRate: "$24.00/hr",
      status: "Inactive",
    },
    {
      id: "EMP-005",
      name: "David Green",
      role: "Harvest Coordinator",
      contract: "Full Time",
      payRate: "$31.00/hr",
      status: "Active",
    },
  ]);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    contract: "Full Time",
    payRate: "",
    status: "Active",
  });

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase();

    return (
      employee.id.toLowerCase().includes(searchText) ||
      employee.name.toLowerCase().includes(searchText) ||
      employee.role.toLowerCase().includes(searchText) ||
      employee.contract.toLowerCase().includes(searchText) ||
      employee.status.toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // DELETE EMPLOYEE
  // ==========================================

  const handleDelete = (id) => {
    setEmployees((currentEmployees) =>
      currentEmployees.filter((employee) => employee.id !== id)
    );
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewEmployee((previousEmployee) => ({
      ...previousEmployee,
      [name]: value,
    }));
  };

  // ==========================================
  // ADD EMPLOYEE
  // ==========================================

  const handleAddEmployee = (e) => {
    e.preventDefault();

    const employeeNumber = String(employees.length + 1).padStart(3, "0");

    const employee = {
      id: `EMP-${employeeNumber}`,
      name: newEmployee.name,
      role: newEmployee.role,
      contract: newEmployee.contract,
      payRate: newEmployee.payRate.startsWith("$")
        ? newEmployee.payRate
        : `$${newEmployee.payRate}/hr`,
      status: newEmployee.status,
    };

    setEmployees((currentEmployees) => [
      ...currentEmployees,
      employee,
    ]);

    setNewEmployee({
      name: "",
      role: "",
      contract: "Full Time",
      payRate: "",
      status: "Active",
    });

    setShowAddEmployee(false);
  };

  return (
    <div className="employees-page">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="employees-header">
        <h1>Employees</h1>

        <button
          type="button"
          className="add-employee-btn"
          onClick={() => setShowAddEmployee(true)}
        >
          <Plus size={17} />

          <span>Add Employee</span>
        </button>
      </div>

      {/* ======================================
          EMPLOYEE CARD
      ====================================== */}

      <section className="employees-card">
        {/* SEARCH */}

        <div className="employees-search-section">
          <div className="employees-search-box">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ==================================
            EMPLOYEE TABLE
        ================================== */}

        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Contract Type</th>
                <th>Pay Rate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    {/* ID */}

                    <td className="employee-id">
                      {employee.id}
                    </td>

                    {/* NAME */}

                    <td className="employee-name">
                      {employee.name}
                    </td>

                    {/* ROLE */}

                    <td>
                      {employee.role}
                    </td>

                    {/* CONTRACT */}

                    <td>
                      <span
                        className={`contract-badge ${employee.contract
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {employee.contract}
                      </span>
                    </td>

                    {/* PAY */}

                    <td>
                      {employee.payRate}
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={
                          employee.status === "Active"
                            ? "employee-status active"
                            : "employee-status inactive"
                        }
                      >
                        {employee.status}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td>
                      <div className="employee-actions">
                        <button
                          type="button"
                          className="employee-action-btn"
                          title="Edit employee"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          className="employee-action-btn delete"
                          title="Delete employee"
                          onClick={() =>
                            handleDelete(employee.id)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="no-employees"
                  >
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================
            FOOTER
        ================================== */}

        <div className="employees-footer">
          Showing {filteredEmployees.length} of{" "}
          {employees.length} employees
        </div>
      </section>

      {/* ======================================
          ADD EMPLOYEE MODAL
      ====================================== */}

      {showAddEmployee && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">
            {/* Modal Header */}

            <div className="employee-modal-header">
              <h2>Add Employee</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowAddEmployee(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleAddEmployee}>
              {/* NAME */}

              <div className="employee-form-group">
                <label htmlFor="employee-name">
                  Employee Name
                </label>

                <input
                  id="employee-name"
                  type="text"
                  name="name"
                  placeholder="Enter employee name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* ROLE */}

              <div className="employee-form-group">
                <label htmlFor="employee-role">
                  Role
                </label>

                <input
                  id="employee-role"
                  type="text"
                  name="role"
                  placeholder="Enter employee role"
                  value={newEmployee.role}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* CONTRACT */}

              <div className="employee-form-group">
                <label htmlFor="employee-contract">
                  Contract Type
                </label>

                <select
                  id="employee-contract"
                  name="contract"
                  value={newEmployee.contract}
                  onChange={handleInputChange}
                >
                  <option value="Full Time">
                    Full Time
                  </option>

                  <option value="Part Time">
                    Part Time
                  </option>

                  <option value="Casual">
                    Casual
                  </option>
                </select>
              </div>

              {/* PAY RATE */}

              <div className="employee-form-group">
                <label htmlFor="employee-pay">
                  Pay Rate
                </label>

                <input
                  id="employee-pay"
                  type="number"
                  name="payRate"
                  placeholder="Example: 28.00"
                  step="0.01"
                  value={newEmployee.payRate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* STATUS */}

              <div className="employee-form-group">
                <label htmlFor="employee-status">
                  Status
                </label>

                <select
                  id="employee-status"
                  name="status"
                  value={newEmployee.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* BUTTONS */}

              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-cancel-btn"
                  onClick={() =>
                    setShowAddEmployee(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="employee-save-btn"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;