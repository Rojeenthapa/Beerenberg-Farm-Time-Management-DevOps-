import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  apiRequest,
  getStoredUser
} from "../api";

import "../styles/ClockInOut.css";

function ClockInOut() {
  const currentUser = getStoredUser();

  const isAdmin = Boolean(
    currentUser?.is_admin
  );

  const [employees, setEmployees] =
    useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(
      currentUser?.employee_id
        ? String(currentUser.employee_id)
        : ""
    );

  const [timeLogs, setTimeLogs] =
    useState([]);

  const [openTimeLog, setOpenTimeLog] =
    useState(null);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [station, setStation] =
    useState("Packing Shed");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const selectedEmployee = useMemo(() => {
    return employees.find(
      (employee) =>
        String(employee.employee_id) ===
        String(selectedEmployeeId)
    );
  }, [
    employees,
    selectedEmployeeId
  ]);

  const loadEmployee = async () => {
    if (!currentUser?.employee_id) {
      throw new Error(
        "This account is not linked to an employee."
      );
    }

    const employee = await apiRequest(
      `/employees/${currentUser.employee_id}`
    );

    setEmployees([
      employee
    ]);

    setSelectedEmployeeId(
      String(employee.employee_id)
    );
  };

  const loadEmployees = async () => {
    const data = await apiRequest(
      "/employees?status=Active"
    );

    setEmployees(data);

    if (
      data.length > 0 &&
      !selectedEmployeeId
    ) {
      setSelectedEmployeeId(
        String(data[0].employee_id)
      );
    }
  };

  const loadTimeLogs = async (
    employeeId
  ) => {
    if (!employeeId) {
      setTimeLogs([]);
      setOpenTimeLog(null);
      return;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const data = await apiRequest(
      `/timelogs?employee_id=${employeeId}&date=${today}`
    );

    setTimeLogs(data);

    const activeLog = data.find(
      (timeLog) =>
        timeLog.clock_out === null
    );

    setOpenTimeLog(activeLog || null);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      try {
        if (isAdmin) {
          await loadEmployees();
        } else {
          await loadEmployee();
        }
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      return;
    }

    const refreshLogs = async () => {
      try {
        await loadTimeLogs(
          selectedEmployeeId
        );
      } catch (requestError) {
        setError(
          requestError.message
        );
      }
    };

    refreshLogs();
  }, [
    selectedEmployeeId
  ]);

  const formattedTime =
    currentTime.toLocaleTimeString(
      "en-AU",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }
    );

  const formattedDate =
    currentTime.toLocaleDateString(
      "en-AU",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  const formatTime = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value)
      .toLocaleTimeString(
        "en-AU",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }
      );
  };

  const handleClockAction = async () => {
    if (!selectedEmployeeId) {
      setError(
        "No employee is selected."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (openTimeLog) {
        await apiRequest(
          `/timelogs/${openTimeLog.timelog_id}/clock-out`,
          {
            method: "POST"
          }
        );

        setSuccessMessage(
          "Clocked out successfully."
        );
      } else {
        await apiRequest(
          "/timelogs/clock-in",
          {
            method: "POST",
            body: JSON.stringify({
              employee_id: Number(
                selectedEmployeeId
              )
            })
          }
        );

        setSuccessMessage(
          "Clocked in successfully."
        );
      }

      await loadTimeLogs(
        selectedEmployeeId
      );

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="clock-page">
        <div className="page-header">
          <h1>
            Clock In / Clock Out
          </h1>

          <p>
            Loading...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="clock-page">
      <div className="page-header">
        <h1>
          Clock In / Clock Out
        </h1>

        <p>
          {formattedDate}
        </p>
      </div>

      {error && (
        <div className="clock-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="clock-success">
          {successMessage}
        </div>
      )}

      <section className="clock-card">
        {isAdmin && (
          <div className="employee-selector">
            <label htmlFor="clock-employee">
              Employee
            </label>

            <select
              id="clock-employee"
              value={selectedEmployeeId}
              onChange={(event) => {
                setSelectedEmployeeId(
                  event.target.value
                );
              }}
            >
              {employees.map((employee) => (
                <option
                  key={employee.employee_id}
                  value={employee.employee_id}
                >
                  {employee.display_id} —{" "}
                  {employee.first_name}{" "}
                  {employee.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedEmployee && (
          <>
            <div className="employee-avatar">
              {selectedEmployee.first_name
                .charAt(0)
                .toUpperCase()}
              {selectedEmployee.last_name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="employee-information">
              <h2>
                {selectedEmployee.first_name}{" "}
                {selectedEmployee.last_name}
              </h2>

              <p className="employee-role">
                {selectedEmployee.role}
              </p>

              <p>
                Employee ID:{" "}
                {selectedEmployee.display_id}
              </p>
            </div>

            <div className="current-time">
              {formattedTime}
            </div>

            <div className="status-container">
              <span
                className={
                  openTimeLog
                    ? "status active"
                    : "status inactive"
                }
              >
                {openTimeLog
                  ? "Clocked In"
                  : "Clocked Out"}
              </span>

              <span className="status compliance">
                {currentUser?.role}
              </span>
            </div>

            <div className="station-container">
              <label htmlFor="station">
                Station
              </label>

              <select
                id="station"
                value={station}
                onChange={(event) => {
                  setStation(
                    event.target.value
                  );
                }}
              >
                <option value="Main Gate">
                  Main Gate
                </option>

                <option value="Packing Shed">
                  Packing Shed
                </option>

                <option value="Warehouse">
                  Warehouse
                </option>

                <option value="Field Station">
                  Field Station
                </option>
              </select>
            </div>

            <button
              type="button"
              className={
                openTimeLog
                  ? "clock-out-btn"
                  : "clock-in-btn"
              }
              onClick={handleClockAction}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : openTimeLog
                  ? "Clock Out"
                  : "Clock In"}
            </button>
          </>
        )}

        {!selectedEmployee && (
          <p className="no-employee-message">
            No employee record is linked to this account.
          </p>
        )}
      </section>

      <section className="activity-card">
        <h3>
          Today's Activity
        </h3>

        <div className="activity-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  Clock In
                </th>

                <th>
                  Clock Out
                </th>

                <th>
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {timeLogs.map((timeLog) => (
                <tr
                  key={timeLog.timelog_id}
                >
                  <td>
                    <span className="activity-in">
                      {formatTime(
                        timeLog.clock_in
                      )}
                    </span>
                  </td>

                  <td>
                    {timeLog.clock_out ? (
                      <span className="activity-out">
                        {formatTime(
                          timeLog.clock_out
                        )}
                      </span>
                    ) : (
                      <span className="activity-open">
                        Still clocked in
                      </span>
                    )}
                  </td>

                  <td>
                    {timeLog.date}
                  </td>
                </tr>
              ))}

              {timeLogs.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="no-activity"
                  >
                    No time records for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="activity-footer">
          {timeLogs.length} record
          {timeLogs.length === 1
            ? ""
            : "s"} recorded today
        </div>
      </section>
    </section>
  );
}

export default ClockInOut;