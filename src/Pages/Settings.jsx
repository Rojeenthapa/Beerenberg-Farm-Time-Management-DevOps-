import {
  useEffect,
  useState
} from "react";

import {
  LockKeyhole
} from "lucide-react";

import {
  apiRequest
} from "../api";

import "../styles/Settings.css";


function Settings({
  currentUser
}) {
  const [users, setUsers] =
    useState([]);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [passwords, setPasswords] =
    useState({
      current_password: "",
      new_password: "",
      confirm_password: ""
    });

  const isAdmin = Boolean(
    currentUser?.is_admin
  );


  const loadUsers = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const response = await apiRequest(
        "/users"
      );

      setUsers(
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


  useEffect(() => {
    loadUsers();
  }, []);


  const handlePasswordChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value
    }));
  };


  const submitPasswordChange = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      await apiRequest(
        "/password/change",
        {
          method: "POST",
          body: JSON.stringify(
            passwords
          )
        }
      );

      setMessage(
        "Password changed successfully."
      );

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  };


  return (
    <section className="settings-page">
      <div className="page-header">
        <div>
          <h1>
            Settings
          </h1>

          <p>
            Manage your account and system users.
          </p>
        </div>
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

      <div className="settings-card">
        <div className="section-heading">
          <LockKeyhole size={18} />

          <h2>
            Change Password
          </h2>
        </div>

        <form
          className="settings-form"
          onSubmit={submitPasswordChange}
        >
          <label>
            Current Password
            <input
              type="password"
              name="current_password"
              value={
                passwords.current_password
              }
              required
              onChange={
                handlePasswordChange
              }
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              name="new_password"
              value={
                passwords.new_password
              }
              required
              onChange={
                handlePasswordChange
              }
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirm_password"
              value={
                passwords.confirm_password
              }
              required
              onChange={
                handlePasswordChange
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
          >
            Change Password
          </button>
        </form>
      </div>

      {isAdmin && (
        <div className="data-card">
          <div className="section-heading">
            <h2>
              System Users
            </h2>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.user_id}
                  >
                    <td>
                      {user.first_name}{" "}
                      {user.last_name}
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.role}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="empty-row"
                    >
                      No users found.
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


export default Settings;