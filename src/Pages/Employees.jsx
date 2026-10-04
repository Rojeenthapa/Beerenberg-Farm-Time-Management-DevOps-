import {
  useEffect,
  useState
} from "react";

import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";

import {
  apiRequest
} from "../api";

import "../styles/Employees.css";


function Employees({
  currentUser
}) {
  const [employees, setEmployees] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showEmployeeModal, setShowEmployeeModal] =
    useState(false);

  const [showLoginModal, setShowLoginModal] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [loginEmployee, setLoginEmployee] =
    useState(null);


  const emptyEmployeeForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    employee_role: "",
    contract_type: "Full Time",
    standard_hours: "38",
    pay_rate: "",
    overtime_pay_rate: "",
    hire_date: "",
    status: "Active",
    user_id: "",
    password: "",
    role: "Staff"
  };


  const [employeeForm, setEmployeeForm] =
    useState(
      emptyEmployeeForm
    );


  const [loginForm, setLoginForm] =
    useState({
      user_id: "",
      password: "",
      role: "Staff"
    });


  const isAdmin = Boolean(
    currentUser?.is_admin
  );


  useEffect(() => {
    if (isAdmin) {
      loadEmployees();
    }
  }, [
    isAdmin
  ]);


  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest(
        "/employees"
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

    } finally {
      setLoading(false);
    }
  }


  function getPreviewEmployeeId() {
    const lastName = employeeForm.last_name
      .trim()
      .slice(0, 3)
      .toUpperCase();

    const hireDate = employeeForm.hire_date;

    if (
      lastName.length === 0 ||
      !hireDate ||
      hireDate.length < 10
    ) {
      return "Generated automatically";
    }

    const joiningDay = hireDate.slice(
      8,
      10
    );

    const joiningMonth = hireDate.slice(
      5,
      7
    );

    return (
      `${lastName}` +
      `${joiningDay}` +
      `${joiningMonth}`
    );
  }


  function handleEmployeeFormChange(
    event
  ) {
    const {
      name,
      value
    } = event.target;

    setEmployeeForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value
      })
    );
  }


  function handleLoginFormChange(
    event
  ) {
    const {
      name,
      value
    } = event.target;

    setLoginForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value
      })
    );
  }


  function openCreateEmployeeModal() {
    setEditingEmployee(null);
    setEmployeeForm(
      emptyEmployeeForm
    );
    setError("");
    setMessage("");
    setShowEmployeeModal(true);
  }


  function openEditEmployeeModal(
    employee
  ) {
    setEditingEmployee(employee);

    setEmployeeForm({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      employee_role: employee.role || "",
      contract_type:
        employee.contract_type ||
        "Full Time",
      standard_hours: String(
        employee.standard_hours || 38
      ),
      pay_rate: String(
        employee.pay_rate || ""
      ),
      overtime_pay_rate: String(
        employee.overtime_pay_rate || ""
      ),
      hire_date: employee.hire_date || "",
      status: employee.status || "Active",
      user_id: employee.login_id || "",
      password: "",
      role: employee.login_role || "Staff"
    });

    setError("");
    setMessage("");
    setShowEmployeeModal(true);
  }


  function openCreateLoginModal(
    employee
  ) {
    if (employee.has_login_account) {
      return;
    }

    setLoginEmployee(employee);

    setLoginForm({
      user_id: "",
      password: "",
      role: "Staff"
    });

    setError("");
    setMessage("");
    setShowLoginModal(true);
  }


  function closeEmployeeModal() {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeForm(
      emptyEmployeeForm
    );
  }


  function closeLoginModal() {
    setShowLoginModal(false);
    setLoginEmployee(null);

    setLoginForm({
      user_id: "",
      password: "",
      role: "Staff"
    });
  }


  async function handleEmployeeSubmit(
    event
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !editingEmployee &&
      !employeeForm.password
    ) {
      setError(
        "A password is required."
      );

      return;
    }

    if (
      !editingEmployee &&
      employeeForm.password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    if (
      !editingEmployee &&
      !employeeForm.user_id.trim()
    ) {
      setError(
        "A login User ID is required."
      );

      return;
    }

    try {
      if (editingEmployee) {
        await apiRequest(
          `/employees/${editingEmployee.employee_id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              first_name:
                employeeForm.first_name,
              last_name:
                employeeForm.last_name,
              email:
                employeeForm.email,
              phone:
                employeeForm.phone,
              role:
                employeeForm.employee_role,
              contract_type:
                employeeForm.contract_type,
              standard_hours: Number(
                employeeForm.standard_hours
              ),
              pay_rate: Number(
                employeeForm.pay_rate
              ),
              overtime_pay_rate: Number(
                employeeForm.overtime_pay_rate
              ),
              hire_date:
                employeeForm.hire_date,
              status:
                employeeForm.status
            })
          }
        );

        setMessage(
          "Employee updated successfully."
        );

      } else {
        const response = await apiRequest(
          "/employees",
          {
            method: "POST",
            body: JSON.stringify({
              first_name:
                employeeForm.first_name,
              last_name:
                employeeForm.last_name,
              email:
                employeeForm.email,
              phone:
                employeeForm.phone,
              employee_role:
                employeeForm.employee_role,
              contract_type:
                employeeForm.contract_type,
              standard_hours: Number(
                employeeForm.standard_hours
              ),
              pay_rate: Number(
                employeeForm.pay_rate
              ),
              overtime_pay_rate: Number(
                employeeForm.overtime_pay_rate
              ),
              hire_date:
                employeeForm.hire_date,
              status:
                employeeForm.status,
              user_id:
                employeeForm.user_id.trim(),
              password:
                employeeForm.password,
              role:
                employeeForm.role
            })
          }
        );

        setMessage(
          `Employee created. Employee ID: ${
            response.employee.employee_code
          }. Login User ID: ${
            response.user.login_id
          }.`
        );
      }

      closeEmployeeModal();
      await loadEmployees();

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  }


  async function handleCreateLogin(
    event
  ) {
    event.preventDefault();

    if (!loginEmployee) {
      return;
    }

    if (
      loginEmployee.has_login_account
    ) {
      setError(
        "This employee already has login credentials."
      );

      return;
    }

    if (
      !loginForm.user_id.trim()
    ) {
      setError(
        "A login User ID is required."
      );

      return;
    }

    if (
      loginForm.password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await apiRequest(
        `/employees/${loginEmployee.employee_id}/login-account`,
        {
          method: "POST",
          body: JSON.stringify({
            user_id:
              loginForm.user_id.trim(),
            password:
              loginForm.password,
            role:
              loginForm.role
          })
        }
      );

      closeLoginModal();

      setMessage(
        `Login created for ${
          response.user.login_id
        }.`
      );

      await loadEmployees();

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  }


  async function handleDelete(
    employeeId
  ) {
    const confirmed = window.confirm(
      "Delete this employee and their login account?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/employees/${employeeId}`,
        {
          method: "DELETE"
        }
      );

      setMessage(
        "Employee deleted successfully."
      );

      await loadEmployees();

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  }


  const filteredEmployees =
    employees.filter((employee) => {
      const searchText = search
        .trim()
        .toLowerCase();

      const searchableText = [
        employee.employee_code,
        employee.display_id,
        employee.login_id,
        employee.user_id,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.role,
        employee.contract_type,
        employee.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        searchText
      );
    });


  if (!isAdmin) {
    return (
      <section className="employees-page">
        <div className="page-error">
          Administrator access is required.
        </div>
      </section>
    );
  }


  return (
    <section className="employees-page">
      <div className="page-header">
        <div>
          <h1>
            Employees
          </h1>

          <p>
            Manage employees, employee IDs, and login credentials.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            openCreateEmployeeModal
          }
        >
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      {message && (
        <div className="page-success">
          {message}
        </div>
      )}

      <div className="search-card">
        <Search size={17} />

        <input
          type="search"
          value={search}
          placeholder="Search employees, IDs, or login user IDs"
          onChange={(event) => {
            setSearch(
              event.target.value
            );
          }}
        />
      </div>

      <div className="data-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  Employee ID
                </th>

                <th>
                  Login User ID
                </th>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Position
                </th>

                <th>
                  Pay Rate
                </th>

                <th>
                  Login Status
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map(
                (employee) => (
                  <tr
                    key={
                      employee.employee_id
                    }
                  >
                    <td>
                      <span className="employee-code">
                        {employee.employee_code ||
                          employee.display_id ||
                          "—"}
                      </span>
                    </td>

                    <td>
                      {employee.login_id || "—"}
                    </td>

                    <td>
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
                      $
                      {Number(
                        employee.pay_rate || 0
                      ).toFixed(2)}
                      /hr
                    </td>

                    <td>
                      {employee.has_login_account ? (
                        <span className="status-badge active">
                          Login Created
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="login-account-button"
                          onClick={() => {
                            openCreateLoginModal(
                              employee
                            );
                          }}
                        >
                          <KeyRound size={14} />
                          Create Login
                        </button>
                      )}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          title="Edit employee"
                          onClick={() => {
                            openEditEmployeeModal(
                              employee
                            );
                          }}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          title="Delete employee"
                          onClick={() => {
                            handleDelete(
                              employee.employee_id
                            );
                          }}
                        >
                          <Trash2 size={15} />
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
                      className="empty-row"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}

              {loading && (
                <tr>
                  <td
                    colSpan="8"
                    className="empty-row"
                  >
                    Loading employees...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-card employee-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <p className="modal-subtitle">
                  {editingEmployee
                    ? "Update employee details."
                    : "Create an employee and their login account."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEmployeeModal
                }
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="form-grid"
              onSubmit={
                handleEmployeeSubmit
              }
            >
              <label>
                First Name
                <input
                  name="first_name"
                  value={
                    employeeForm.first_name
                  }
                  required
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Surname
                <input
                  name="last_name"
                  value={
                    employeeForm.last_name
                  }
                  required
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Generated Employee ID
                <input
                  value={
                    getPreviewEmployeeId()
                  }
                  readOnly
                  disabled
                />
                <small className="field-help">
                  First 3 surname letters + joining day + joining month.
                </small>
              </label>

              <label>
                Joining Date
                <input
                  name="hire_date"
                  type="date"
                  value={
                    employeeForm.hire_date
                  }
                  required
                  disabled={
                    Boolean(
                      editingEmployee
                    )
                  }
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={
                    employeeForm.email
                  }
                  required
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={
                    employeeForm.phone
                  }
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Employee Position
                <input
                  name="employee_role"
                  value={
                    employeeForm.employee_role
                  }
                  required
                  placeholder="Field Supervisor"
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Contract Type
                <select
                  name="contract_type"
                  value={
                    employeeForm.contract_type
                  }
                  onChange={
                    handleEmployeeFormChange
                  }
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
              </label>

              <label>
                Standard Hours
                <input
                  name="standard_hours"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    employeeForm.standard_hours
                  }
                  required
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Pay Rate
                <input
                  name="pay_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    employeeForm.pay_rate
                  }
                  required
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Overtime Pay Rate
                <input
                  name="overtime_pay_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    employeeForm.overtime_pay_rate
                  }
                  required
                  onChange={
                    handleEmployeeFormChange
                  }
                />
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={
                    employeeForm.status
                  }
                  onChange={
                    handleEmployeeFormChange
                  }
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </label>

              {!editingEmployee && (
                <>
                  <label>
                    Login User ID
                    <input
                      name="user_id"
                      value={
                        employeeForm.user_id
                      }
                      required
                      placeholder="Created by administrator"
                      onChange={
                        handleEmployeeFormChange
                      }
                    />
                    <small className="field-help">
                      This is what the employee enters at login.
                    </small>
                  </label>

                  <label>
                    Login Role
                    <select
                      name="role"
                      value={
                        employeeForm.role
                      }
                      onChange={
                        handleEmployeeFormChange
                      }
                    >
                      <option value="Staff">
                        Staff
                      </option>

                      <option value="User">
                        User
                      </option>

                      <option value="Admin">
                        Admin
                      </option>
                    </select>
                  </label>

                  <label>
                    Login Password
                    <input
                      name="password"
                      type="password"
                      minLength="8"
                      value={
                        employeeForm.password
                      }
                      required
                      placeholder="Minimum 8 characters"
                      onChange={
                        handleEmployeeFormChange
                      }
                    />
                  </label>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeEmployeeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingEmployee
                    ? "Save Employee"
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLoginModal && loginEmployee && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>
                  Create Login Credentials
                </h2>

                <p className="modal-subtitle">
                  {loginEmployee.first_name}{" "}
                  {loginEmployee.last_name}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeLoginModal
                }
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="settings-form"
              onSubmit={
                handleCreateLogin
              }
            >
              <label>
                Employee ID
                <input
                  value={
                    loginEmployee.employee_code ||
                    loginEmployee.display_id ||
                    ""
                  }
                  disabled
                />
              </label>

              <label>
                Login User ID
                <input
                  name="user_id"
                  value={
                    loginForm.user_id
                  }
                  required
                  placeholder="Enter user ID"
                  onChange={
                    handleLoginFormChange
                  }
                />
              </label>

              <label>
                Login Role
                <select
                  name="role"
                  value={
                    loginForm.role
                  }
                  onChange={
                    handleLoginFormChange
                  }
                >
                  <option value="Staff">
                    Staff
                  </option>

                  <option value="User">
                    User
                  </option>

                  <option value="Admin">
                    Admin
                  </option>
                </select>
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  value={
                    loginForm.password
                  }
                  required
                  placeholder="Minimum 8 characters"
                  onChange={
                    handleLoginFormChange
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeLoginModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Create Login
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