import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  X
} from "lucide-react";
import "../styles/Employees.css";


const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  contract_type: "Full Time",
  standard_hours: "38",
  pay_rate: "",
  overtime_pay_rate: "",
  hire_date: ""
};


function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [showEmployeeModal, setShowEmployeeModal] =
    useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  useEffect(() => {
    loadEmployees();
  }, []);


  async function loadEmployees() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(
      "/api/employees",
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const contentType =
      response.headers.get("content-type") || "";

    const responseText = await response.text();

    if (!contentType.includes("application/json")) {
      throw new Error(
        `The backend returned HTML instead of JSON. ` +
        `HTTP status: ${response.status}. ` +
        `Check Flask and the Vite proxy.`
      );
    }

    const data = JSON.parse(responseText);

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load employees."
      );
    }

    setEmployees(data);
  } catch (loadError) {
    setEmployees([]);
    setError(loadError.message);
  } finally {
    setLoading(false);
  }
}


  function openAddModal() {
    setEditingEmployee(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowEmployeeModal(true);
  }


  function openEditModal(employee) {
    setEditingEmployee(employee);

    setForm({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "",
      contract_type:
        employee.contract_type || "Full Time",
      standard_hours: String(
        employee.standard_hours ?? ""
      ),
      pay_rate: String(
        employee.pay_rate ?? ""
      ),
      overtime_pay_rate: String(
        employee.overtime_pay_rate ?? ""
      ),
      hire_date: employee.hire_date || ""
    });

    setError("");
    setMessage("");
    setShowEmployeeModal(true);
  }


  function closeModal() {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setForm(emptyForm);
  }


  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      standard_hours: Number(
        form.standard_hours
      ),
      pay_rate: Number(
        form.pay_rate
      ),
      overtime_pay_rate: Number(
        form.overtime_pay_rate
      )
    };

    const url = editingEmployee
      ? `/api/employees/${editingEmployee.employee_id}`
      : "/api/employees";

    const method = editingEmployee
      ? "PUT"
      : "POST";

    try {
      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save employee."
        );
      }

      setMessage(
        data.message ||
        (
          editingEmployee
            ? "Employee updated successfully."
            : "Employee created successfully."
        )
      );

      closeModal();
      await loadEmployees();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleDeactivate(employeeId) {
    const confirmed = window.confirm(
      "Deactivate this employee?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/deactivate`,
        {
          method: "PATCH",
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to deactivate employee."
        );
      }

      setMessage(
        "Employee deactivated successfully."
      );

      await loadEmployees();
    } catch (deactivateError) {
      setError(deactivateError.message);
    } finally {
      setLoading(false);
    }
  }


  const filteredEmployees = useMemo(() => {
    const searchText = search.toLowerCase();

    return employees.filter((employee) => {
      const fullName = [
        employee.first_name,
        employee.last_name
      ]
        .join(" ")
        .toLowerCase();

      return (
        fullName.includes(searchText) ||
        employee.email
          .toLowerCase()
          .includes(searchText) ||
        employee.role
          .toLowerCase()
          .includes(searchText) ||
        employee.contract_type
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [employees, search]);


  return (
    <div className="employees-page">
      <div className="employees-header">
        <h1>Employees</h1>

        <button
          type="button"
          className="add-employee-btn"
          onClick={openAddModal}
        >
          <Plus size={17} />
          <span>Add Employee</span>
        </button>
      </div>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p
          className="success-message"
          role="status"
        >
          {message}
        </p>
      )}

      <section className="employees-card">
        <div className="employees-search-section">
          <div className="employees-search-box">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>
        </div>

        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Contract Type</th>
                <th>Pay Rate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="8"
                    className="no-employees"
                  >
                    Loading employees...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.employee_id}
                  >
                    <td className="employee-id">
                      {employee.employee_id}
                    </td>

                    <td className="employee-name">
                      {employee.first_name}{" "}
                      {employee.last_name}
                    </td>

                    <td>{employee.email}</td>

                    <td>{employee.role}</td>

                    <td>
                      <span
                        className={
                          "contract-badge " +
                          employee.contract_type
                            .toLowerCase()
                            .replace(" ", "-")
                        }
                      >
                        {employee.contract_type}
                      </span>
                    </td>

                    <td>
                      $
                      {Number(
                        employee.pay_rate
                      ).toFixed(2)}
                    </td>

                    <td>
                      <span className="employee-status active">
                        {employee.status}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          type="button"
                          className="employee-action-btn"
                          title="Edit employee"
                          onClick={() =>
                            openEditModal(
                              employee
                            )
                          }
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          className="employee-action-btn delete"
                          onClick={() =>
                            handleDeactivate(
                              employee.employee_id
                            )
                          }
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading &&
                filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="no-employees"
                    >
                      No active employees found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="employees-footer">
          Showing {filteredEmployees.length} of{" "}
          {employees.length} active employees
        </div>
      </section>

      {showEmployeeModal && (
        <div className="employee-modal-overlay">
          <div className="employee-modal">
            <div className="employee-modal-header">
              <h2>
                {editingEmployee
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="employee-form-group">
                <label htmlFor="first_name">
                  First name
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="last_name">
                  Last name
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="phone">
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="role">
                  Role
                </label>

                <input
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="contract_type">
                  Contract type
                </label>

                <select
                  id="contract_type"
                  name="contract_type"
                  value={form.contract_type}
                  onChange={handleInputChange}
                  required
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

              <div className="employee-form-group">
                <label htmlFor="standard_hours">
                  Standard hours
                </label>

                <input
                  id="standard_hours"
                  type="number"
                  name="standard_hours"
                  value={form.standard_hours}
                  onChange={handleInputChange}
                  min="0"
                  max="60"
                  step="0.5"
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="pay_rate">
                  Pay rate
                </label>

                <input
                  id="pay_rate"
                  type="number"
                  name="pay_rate"
                  value={form.pay_rate}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="overtime_pay_rate">
                  Overtime pay rate
                </label>

                <input
                  id="overtime_pay_rate"
                  type="number"
                  name="overtime_pay_rate"
                  value={form.overtime_pay_rate}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="hire_date">
                  Hire date
                </label>

                <input
                  id="hire_date"
                  type="date"
                  name="hire_date"
                  value={form.hire_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="employee-save-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingEmployee
                      ? "Save Changes"
                      : "Add Employee"}
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