import {
  useEffect,
  useMemo,
  useState
} from "react";

import "../styles/ClockInOut.css";

const API_URL =
  "http://127.0.0.1:5000/api";

function ClockInOut({
  currentUser
}) {
  const [employees, setEmployees] =
    useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

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

  const loadEmployees = async () => {
    const response = await fetch(
      `${API_URL}/employees?status=Active`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to load active employees."
      );
    }

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

    const response = await fetch(
      `${API_URL}/timelogs?employee_id=${employeeId}&date=${today}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to load today's time logs."
      );
    }

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
        await loadEmployees();
      } catch (requestError) {
        setError(requestError.message);
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
        setError(requestError.message);
      }
    };

    refreshLogs();
  }, [selectedEmployeeId]);

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

  const handleEmployeeChange = async (
    event
  ) => {
    const employeeId =
      event.target.value;

    setSelectedEmployeeId(employeeId);
    setError("");
    setSuccessMessage("");

    try {
      await loadTimeLogs(employeeId);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleClockAction = async () => {
    if (!selectedEmployeeId) {
      setError(
        "Please select an employee."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      let response;

      if (openTimeLog) {
        response = await fetch(
          `${API_URL}/timelogs/${openTimeLog.timelog_id}/clock-out`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      } else {
        response = await fetch(
          `${API_URL}/timelogs/clock-in`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              employee_id: Number(
                selectedEmployeeId
              )
            })
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Clock action failed."
        );
      }

      await loadTimeLogs(
        selectedEmployeeId
      );

      setSuccessMessage(
        openTimeLog
          ? "Clocked out successfully."
          : "Clocked in successfully."
      );

    } catch (requestError) {
      setError(requestError.message);
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
            Loading employees...
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
        <div className="employee-selector">
          <label htmlFor="clock-employee">
            Employee
          </label>

          <select
            id="clock-employee"
            value={selectedEmployeeId}
            onChange={handleEmployeeChange}
          >
            {employees.length === 0 && (
              <option value="">
                No active employees available
              </option>
            )}

            {employees.map((employee) => (
              <option
                key={employee.employee_id}
                value={employee.employee_id}
              >
                {employee.first_name}{" "}
                {employee.last_name}
                {" — "}
                {employee.role}
              </option>
            ))}
          </select>
        </div>

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
                {selectedEmployee.employee_id}
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
                Database Connected
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

        {!selectedEmployee &&
          employees.length === 0 && (
            <p className="no-employee-message">
              Add an active employee before using
              Clock In / Clock Out.
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
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Date</th>
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