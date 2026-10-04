import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Pencil,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";

import {
  apiRequest,
  getStoredUser
} from "../api";

import "../styles/Employees.css";

const EMPTY_EMPLOYEE = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  contract_type: "Full Time",
  standard_hours: "38",
  pay_rate: "",
  overtime_pay_rate: "",
  status: "Active",
  hire_date: ""
};

function Employees() {
  const currentUser = getStoredUser();

  const isAdmin = Boolean(
    currentUser?.is_admin
  );

  const [employees, setEmployees] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingEmployeeId, setEditingEmployeeId] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_EMPLOYEE);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const loadEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        "/employees"
      );

      setEmployees(data);

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    if (!searchText) {
      return employees;
    }

    return employees.filter((employee) => {
      const fullName = [
        employee.first_name,
        employee.last_name
      ].join(" ");

      return [
        employee.display_id,
        employee.employee_id,
        fullName,
        employee.email,
        employee.role,
        employee.contract_type,
        employee.status
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText);
    });
  }, [
    employees,
    search
  ]);

  const handleInputChange = (event) => {
    const {
      name,
      value
    } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setEditingEmployeeId(null);

    setForm({
      ...EMPTY_EMPLOYEE,
      hire_date: new Date()
        .toISOString()
        .slice(0, 10)
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployeeId(
      employee.employee_id
    );

    setForm({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "",
      contract_type:
        employee.contract_type ||
        "Full Time",
      standard_hours:
        employee.standard_hours ?? "",
      pay_rate:
        employee.pay_rate ?? "",
      overtime_pay_rate:
        employee.overtime_pay_rate ?? "",
      status:
        employee.status || "Active",
      hire_date:
        employee.hire_date || ""
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEmployeeId(null);
    setForm(EMPTY_EMPLOYEE);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    const isEditing =
      editingEmployeeId !== null;

    const endpoint = isEditing
      ? `/employees/${editingEmployeeId}`
      : "/employees";

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      role: form.role.trim(),
      contract_type: form.contract_type,
      standard_hours: Number(
        form.standard_hours
      ),
      pay_rate: Number(
        form.pay_rate
      ),
      overtime_pay_rate: Number(
        form.overtime_pay_rate
      ),
      status: form.status,
      hire_date: form.hire_date
    };

    try {
      await apiRequest(
        endpoint,
        {
          method: isEditing
            ? "PUT"
            : "POST",
          body: JSON.stringify(payload)
        }
      );

      closeModal();
      await loadEmployees();

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employeeId) => {
    const confirmed = window.confirm(
      "Delete this employee and all related records?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(employeeId);
    setError("");

    try {
      await apiRequest(
        `/employees/${employeeId}`,
        {
          method: "DELETE"
        }
      );

      await loadEmployees();

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setDeletingId(null);
    }
  };

  const contractClassName = (
    contractType
  ) => {
    return contractType
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  const statusClassName = (
    status
  ) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  if (!isAdmin) {
    return (
      <section className="dashboard-content">
        <h1>
          Access Restricted
        </h1>

        <p className="page-description">
          Only administrators can access
          employee management.
        </p>
      </section>
    );
  }

  return (
    <section className="employees-page">
      <div className="employees-header">
        <h1>
          Employees
        </h1>

        <button
          type="button"
          className="add-employee-btn"
          onClick={openAddModal}
        >
          <Plus size={17} />

          <span>
            Add Employee
          </span>
        </button>
      </div>

      <section className="employees-card">
        <div className="employees-search-section">
          <div className="employees-search-box">
            <Search size={16} />

            <input
              type="search"
              placeholder="Search employees..."
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
              }}
            />
          </div>
        </div>

        {error && (
          <p className="employees-error">
            {error}
          </p>
        )}

        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>
                  Employee ID
                </th>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Contract Type
                </th>

                <th>
                  Pay Rate
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>
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
                filteredEmployees.map(
                  (employee) => (
                    <tr
                      key={
                        employee.employee_id
                      }
                    >
                      <td className="employee-id">
                        {employee.display_id}
                      </td>

                      <td className="employee-name">
                        {employee.first_name}{" "}
                        {employee.last_name}
                      </td>

                      <td>
                        {employee.email}
                      </td>

                      <td>
                        {employee.role}
                      </td>

                      <td>
                        <span
                          className={
                            "contract-badge " +
                            contractClassName(
                              employee.contract_type
                            )
                          }
                        >
                          {employee.contract_type}
                        </span>
                      </td>

                      <td>
                        $
                        {Number(
                          employee.pay_rate || 0
                        ).toFixed(2)}
                        /hr
                      </td>

                      <td>
                        <span
                          className={
                            "employee-status " +
                            statusClassName(
                              employee.status
                            )
                          }
                        >
                          {employee.status}
                        </span>
                      </td>

                      <td>
                        <div className="employee-actions">
                          <button
                            type="button"
                            className="employee-action-btn"
                            title="Edit employee"
                            onClick={() => {
                              openEditModal(
                                employee
                              );
                            }}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            className={
                              "employee-action-btn delete"
                            }
                            title="Delete employee"
                            disabled={
                              deletingId ===
                              employee.employee_id
                            }
                            onClick={() => {
                              handleDelete(
                                employee.employee_id
                              );
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}

              {!loading &&
                filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="no-employees"
                    >
                      No employees found
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="employees-footer">
          Showing{" "}
          {filteredEmployees.length} of{" "}
          {employees.length} employees
        </div>
      </section>

      {showModal && (
        <div
          className="employee-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
          >
            <div className="employee-modal-header">
              <h2 id="employee-modal-title">
                {editingEmployeeId !== null
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="employee-form"
              onSubmit={handleSubmit}
            >
              <div className="employee-form-grid">
                <div className="employee-form-group">
                  <label htmlFor="first_name">
                    First Name
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="Enter first name"
                    value={form.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="employee-form-group">
                  <label htmlFor="last_name">
                    Last Name
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Enter last name"
                    value={form.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="employee-form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="employee@example.com"
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
                  type="text"
                  placeholder="Optional"
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
                  type="text"
                  placeholder="Enter employee role"
                  value={form.role}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-form-group">
                <label htmlFor="contract_type">
                  Contract Type
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

                  <option value="Seasonal">
                    Seasonal
                  </option>
                </select>
              </div>

              <div className="employee-form-grid">
                <div className="employee-form-group">
                  <label htmlFor="standard_hours">
                    Standard Hours
                  </label>

                  <input
                    id="standard_hours"
                    name="standard_hours"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.standard_hours}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="employee-form-group">
                  <label htmlFor="pay_rate">
                    Pay Rate
                  </label>

                  <input
                    id="pay_rate"
                    name="pay_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="28.00"
                    value={form.pay_rate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="employee-form-group">
                <label htmlFor="overtime_pay_rate">
                  Overtime Pay Rate
                </label>

                <input
                  id="overtime_pay_rate"
                  name="overtime_pay_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="42.00"
                  value={
                    form.overtime_pay_rate
                  }
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="employee-form-grid">
                <div className="employee-form-group">
                  <label htmlFor="status">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="employee-form-group">
                  <label htmlFor="hire_date">
                    Hire Date
                  </label>

                  <input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    value={form.hire_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="employee-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEmployeeId !== null
                      ? "Save Changes"
                      : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Employees;