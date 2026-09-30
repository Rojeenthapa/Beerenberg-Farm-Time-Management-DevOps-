import { useState } from "react";
import { UserRound, Pencil, X } from "lucide-react";
import "../styles/Settings.css";

function Settings() {
  // =========================================
  // FARM DETAILS
  // =========================================

  const [farmName, setFarmName] = useState("Beerenberg Farm");
  const [timeZone, setTimeZone] = useState("Australia/Adelaide");
  const [address, setAddress] = useState(
    "Mount Barker Road, Hahndorf SA 5245"
  );

  // =========================================
  // COMPLIANCE RULES
  // =========================================

  const [maxBreakHours, setMaxBreakHours] = useState("4");
  const [weeklyHours, setWeeklyHours] = useState("38");

  // =========================================
  // PASSWORD MODAL
  // =========================================

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // =========================================
  // USERS
  // =========================================

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Admin User",
      email: "admin@beerenberg.com.au",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "John Doe",
      email: "john.doe@beerenberg.com.au",
      role: "Staff",
      status: "Active",
    },
    {
      id: 3,
      name: "Mary Smith",
      email: "mary.smith@beerenberg.com.au",
      role: "Staff",
      status: "Active",
    },
    {
      id: 4,
      name: "Robert Brown",
      email: "r.brown@beerenberg.com.au",
      role: "Staff",
      status: "Active",
    },
    {
      id: 5,
      name: "Linda White",
      email: "l.white@beerenberg.com.au",
      role: "Staff",
      status: "Inactive",
    },
    {
      id: 6,
      name: "David Green",
      email: "d.green@beerenberg.com.au",
      role: "Staff",
      status: "Active",
    },
  ]);

  const [selectedUser, setSelectedUser] = useState(null);

  // =========================================
  // SAVE FARM DETAILS
  // =========================================

  const handleSaveFarm = () => {
    console.log("Farm details saved:", {
      farmName,
      timeZone,
      address,
    });

    alert("Farm details saved successfully.");
  };

  // =========================================
  // SAVE COMPLIANCE RULES
  // =========================================

  const handleSaveCompliance = () => {
    console.log("Compliance rules saved:", {
      maxBreakHours,
      weeklyHours,
    });

    alert("Compliance rules saved successfully.");
  };

  // =========================================
  // CHANGE PASSWORD
  // =========================================

  const handlePasswordChange = (e) => {
    e.preventDefault();

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      alert("Please complete all password fields.");
      return;
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      alert("New passwords do not match.");
      return;
    }

    console.log("Password changed");

    alert("Password changed successfully.");

    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowPasswordModal(false);
  };

  // =========================================
  // EDIT USER
  // =========================================

  const handleUserUpdate = (e) => {
    e.preventDefault();

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === selectedUser.id
          ? selectedUser
          : user
      )
    );

    setSelectedUser(null);
  };

  return (
    <div className="settings-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <div className="settings-header">
        <h1>Settings</h1>

        <div className="settings-admin">
          <span>Welcome, Admin</span>

          <div className="settings-admin-icon">
            <UserRound size={17} />
          </div>
        </div>
      </div>

      {/* =====================================
          ACCOUNT
      ===================================== */}

      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Account</h2>
        </div>

        <div className="account-content">
          <div className="account-profile">
            <div className="account-avatar">
              A
            </div>

            <div className="account-information">
              <h3>Admin User</h3>

              <p>admin@beerenberg.com.au</p>

              <span>Administrator</span>
            </div>
          </div>

          <button
            type="button"
            className="settings-green-btn"
            onClick={() =>
              setShowPasswordModal(true)
            }
          >
            Change Password
          </button>
        </div>
      </section>

      {/* =====================================
          FARM DETAILS
      ===================================== */}

      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Farm Details</h2>
        </div>

        <div className="settings-card-content">
          <div className="farm-details-grid">
            {/* FARM NAME */}

            <div className="settings-form-group">
              <label htmlFor="farmName">
                Farm Name
              </label>

              <input
                id="farmName"
                type="text"
                value={farmName}
                onChange={(e) =>
                  setFarmName(e.target.value)
                }
              />
            </div>

            {/* TIME ZONE */}

            <div className="settings-form-group">
              <label htmlFor="timeZone">
                Time Zone
              </label>

              <select
                id="timeZone"
                value={timeZone}
                onChange={(e) =>
                  setTimeZone(e.target.value)
                }
              >
                <option value="Australia/Adelaide">
                  Australia/Adelaide
                </option>

                <option value="Australia/Sydney">
                  Australia/Sydney
                </option>

                <option value="Australia/Melbourne">
                  Australia/Melbourne
                </option>

                <option value="Australia/Brisbane">
                  Australia/Brisbane
                </option>

                <option value="Australia/Perth">
                  Australia/Perth
                </option>
              </select>
            </div>

            {/* ADDRESS */}

            <div className="settings-form-group">
              <label htmlFor="farmAddress">
                Address
              </label>

              <input
                id="farmAddress"
                type="text"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
              />
            </div>
          </div>

          <div className="settings-save-row">
            <button
              type="button"
              className="settings-green-btn"
              onClick={handleSaveFarm}
            >
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* =====================================
          COMPLIANCE RULES
      ===================================== */}

      <section className="settings-card">
        <div className="settings-card-header">
          <h2>Compliance Rules</h2>
        </div>

        <div className="settings-card-content">
          <div className="compliance-grid">
            <div className="settings-form-group">
              <label htmlFor="maxBreakHours">
                Maximum hours without a break
              </label>

              <input
                id="maxBreakHours"
                type="number"
                min="1"
                value={maxBreakHours}
                onChange={(e) =>
                  setMaxBreakHours(e.target.value)
                }
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="weeklyHours">
                Standard weekly hours
              </label>

              <input
                id="weeklyHours"
                type="number"
                min="1"
                value={weeklyHours}
                onChange={(e) =>
                  setWeeklyHours(e.target.value)
                }
              />
            </div>
          </div>

          <div className="settings-save-row">
            <button
              type="button"
              className="settings-green-btn"
              onClick={handleSaveCompliance}
            >
              Save
            </button>
          </div>
        </div>
      </section>

      {/* =====================================
          USERS & ACCESS
      ===================================== */}

      <section className="settings-card users-access-card">
        <div className="settings-card-header">
          <h2>Users &amp; Access</h2>
        </div>

        <div className="settings-table-wrapper">
          <table className="settings-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="settings-user-name">
                    {user.name}
                  </td>

                  <td className="settings-user-email">
                    {user.email}
                  </td>

                  <td>
                    <span
                      className={`settings-role-badge ${
                        user.role === "Admin"
                          ? "admin-role"
                          : "staff-role"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`settings-status-badge ${
                        user.status === "Active"
                          ? "active-user"
                          : "inactive-user"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="settings-edit-btn"
                      aria-label={`Edit ${user.name}`}
                      onClick={() =>
                        setSelectedUser({
                          ...user,
                        })
                      }
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="settings-table-footer">
          {users.length} users
        </div>
      </section>

      {/* =====================================
          CHANGE PASSWORD MODAL
      ===================================== */}

      {showPasswordModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h2>Change Password</h2>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() =>
                  setShowPasswordModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="settings-form-group">
                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <input
                  id="currentPassword"
                  type="password"
                  value={
                    passwords.currentPassword
                  }
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="newPassword">
                  New Password
                </label>

                <input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      newPassword:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={
                    passwords.confirmPassword
                  }
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={() =>
                    setShowPasswordModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-green-btn"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================
          EDIT USER MODAL
      ===================================== */}

      {selectedUser && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h2>Edit User</h2>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUserUpdate}>
              {/* NAME */}

              <div className="settings-form-group">
                <label htmlFor="editName">
                  Name
                </label>

                <input
                  id="editName"
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {/* EMAIL */}

              <div className="settings-form-group">
                <label htmlFor="editEmail">
                  Email
                </label>

                <input
                  id="editEmail"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              {/* ROLE */}

              <div className="settings-form-group">
                <label htmlFor="editRole">
                  Role
                </label>

                <select
                  id="editRole"
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="Admin">
                    Admin
                  </option>

                  <option value="Staff">
                    Staff
                  </option>
                </select>
              </div>

              {/* STATUS */}

              <div className="settings-form-group">
                <label htmlFor="editStatus">
                  Status
                </label>

                <select
                  id="editStatus"
                  value={selectedUser.status}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-green-btn"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;