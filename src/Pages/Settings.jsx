import { useEffect, useState } from "react";
import {
  Pencil,
  UserRound,
  X
} from "lucide-react";

import {
  apiRequest,
  getStoredUser
} from "../api";

import "../styles/Settings.css";

const EMPTY_USER_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "Staff",
  employee_role: "Farm Staff",
  contract_type: "Full Time",
  standard_hours: "38",
  pay_rate: "0",
  overtime_pay_rate: "0",
  hire_date: ""
};

const EMPTY_PASSWORD_FORM = {
  current_password: "",
  new_password: "",
  confirm_password: ""
};

function Settings() {
  const currentUser = getStoredUser();
  const isAdmin = Boolean(
    currentUser?.is_admin
  );

  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] =
    useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [userForm, setUserForm] =
    useState(EMPTY_USER_FORM);

  const [passwordForm, setPasswordForm] =
    useState(EMPTY_PASSWORD_FORM);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [savingUser, setSavingUser] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const loadUsers = async () => {
    if (!isAdmin) {
      return;
    }

    setLoadingUsers(true);

    try {
      const data = await apiRequest(
        "/users"
      );

      setUsers(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserInput = (event) => {
    const {
      name,
      value
    } = event.target;

    setUserForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handlePasswordInput = (event) => {
    const {
      name,
      value
    } = event.target;

    setPasswordForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setSavingUser(true);
    setMessage("");
    setError("");

    try {
      await apiRequest(
        "/users",
        {
          method: "POST",
          body: JSON.stringify({
            ...userForm,
            standard_hours: Number(
              userForm.standard_hours
            ),
            pay_rate: Number(
              userForm.pay_rate
            ),
            overtime_pay_rate: Number(
              userForm.overtime_pay_rate
            )
          })
        }
      );

      setMessage(
        "User created successfully."
      );

      setUserForm({
        ...EMPTY_USER_FORM,
        hire_date: ""
      });

      setShowCreateUser(false);
      await loadUsers();

    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setChangingPassword(true);
    setMessage("");
    setError("");

    try {
      await apiRequest(
        "/password/change",
        {
          method: "POST",
          body: JSON.stringify(
            passwordForm
          )
        }
      );

      setMessage(
        "Password changed successfully."
      );

      setPasswordForm(
        EMPTY_PASSWORD_FORM
      );

      setShowPasswordModal(false);

    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <section className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>

        <div className="settings-admin">
          <span>
            {currentUser?.first_name}{" "}
            {currentUser?.last_name}
          </span>

          <div className="settings-admin-icon">
            <UserRound size={17} />
          </div>
        </div>
      </div>

      {message && (
        <div className="settings-success">
          {message}
        </div>
      )}

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Account</h2>
        </div>

        <div className="account-content">
          <div className="account-profile">
            <div className="account-avatar">
              {currentUser?.first_name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="account-information">
              <h3>
                {currentUser?.first_name}{" "}
                {currentUser?.last_name}
              </h3>

              <p>
                {currentUser?.email}
              </p>

              <span>
                {currentUser?.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="settings-green-btn"
            onClick={() => {
              setMessage("");
              setError("");
              setShowPasswordModal(true);
            }}
          >
            Change Password
          </button>
        </div>
      </section>

      {isAdmin && (
        <section className="settings-card users-access-card">
          <div className="settings-card-header">
            <div>
              <h2>Users & Access</h2>

              <p>
                Create staff accounts and assign
                their initial password.
              </p>
            </div>

            <button
              type="button"
              className="settings-green-btn"
              onClick={() => {
                setMessage("");
                setError("");

                setUserForm({
                  ...EMPTY_USER_FORM,
                  hire_date: new Date()
                    .toISOString()
                    .slice(0, 10)
                });

                setShowCreateUser(true);
              }}
            >
              Create User
            </button>
          </div>

          <div className="settings-table-wrapper">
            {loadingUsers ? (
              <p className="settings-loading">
                Loading users...
              </p>
            ) : (
              <table className="settings-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id}>
                      <td className="settings-user-name">
                        {user.first_name}{" "}
                        {user.last_name}
                      </td>

                      <td className="settings-user-email">
                        {user.email}
                      </td>

                      <td>
                        <span
                          className={
                            user.is_admin
                              ? "settings-role-badge admin-role"
                              : "settings-role-badge staff-role"
                          }
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span className="settings-status-badge active-user">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        No user accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {showCreateUser && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h2>Create User</h2>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() => {
                  setShowCreateUser(false);
                }}
                disabled={savingUser}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="settings-form-group">
                <label htmlFor="first_name">
                  First Name
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  value={userForm.first_name}
                  onChange={handleUserInput}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="last_name">
                  Last Name
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  value={userForm.last_name}
                  onChange={handleUserInput}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleUserInput}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="password">
                  Initial Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength="8"
                  value={userForm.password}
                  onChange={handleUserInput}
                  required
                />

                <small>
                  Minimum 8 characters.
                </small>
              </div>

              <div className="settings-form-group">
                <label htmlFor="role">
                  Account Role
                </label>

                <select
                  id="role"
                  name="role"
                  value={userForm.role}
                  onChange={handleUserInput}
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
              </div>

              <div className="settings-form-group">
                <label htmlFor="employee_role">
                  Employee Role
                </label>

                <input
                  id="employee_role"
                  name="employee_role"
                  value={userForm.employee_role}
                  onChange={handleUserInput}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="contract_type">
                  Contract Type
                </label>

                <select
                  id="contract_type"
                  name="contract_type"
                  value={userForm.contract_type}
                  onChange={handleUserInput}
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

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={() => {
                    setShowCreateUser(false);
                  }}
                  disabled={savingUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-green-btn"
                  disabled={savingUser}
                >
                  {savingUser
                    ? "Creating..."
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h2>Change Password</h2>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() => {
                  setShowPasswordModal(false);
                }}
                disabled={changingPassword}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="settings-form-group">
                <label htmlFor="current_password">
                  Current Password
                </label>

                <input
                  id="current_password"
                  name="current_password"
                  type="password"
                  value={
                    passwordForm.current_password
                  }
                  onChange={handlePasswordInput}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="new_password">
                  New Password
                </label>

                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  minLength="8"
                  value={
                    passwordForm.new_password
                  }
                  onChange={handlePasswordInput}
                  required
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="confirm_password">
                  Confirm New Password
                </label>

                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  minLength="8"
                  value={
                    passwordForm.confirm_password
                  }
                  onChange={handlePasswordInput}
                  required
                />
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={() => {
                    setShowPasswordModal(false);
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-green-btn"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Saving..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Settings;