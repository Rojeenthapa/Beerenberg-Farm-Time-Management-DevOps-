import {
  useEffect,
  useState
} from "react";

import {
  Clock3
} from "lucide-react";

import {
  apiRequest
} from "../api";

import "../styles/ClockInOut.css";


function ClockInOut({
  currentUser
}) {
  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [timeLogs, setTimeLogs] =
    useState([]);

  const [activeLog, setActiveLog] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const isAdmin = Boolean(
    currentUser?.is_admin
  );


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date()
      );
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);


  const loadTimeLogs = async () => {
    setError("");

    try {
      const response = await apiRequest(
        "/timelogs"
      );

      const logs = Array.isArray(
        response
      )
        ? response
        : [];

      setTimeLogs(logs);

      setActiveLog(
        logs.find(
          (log) => !log.clock_out
        ) || null
      );

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  };


  useEffect(() => {
    loadTimeLogs();
  }, []);


  const handleClockIn = async () => {
    setLoading(true);
    setError("");

    try {
      const data = {};

      if (isAdmin) {
        data.employee_id =
          currentUser.employee_id;
      }

      await apiRequest(
        "/timelogs/clock-in",
        {
          method: "POST",
          body: JSON.stringify(data)
        }
      );

      await loadTimeLogs();

    } catch (requestError) {
      setError(
        requestError.message
      );

    } finally {
      setLoading(false);
    }
  };


  const handleClockOut = async () => {
    if (!activeLog) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest(
        `/timelogs/${activeLog.timelog_id}/clock-out`,
        {
          method: "POST"
        }
      );

      await loadTimeLogs();

    } catch (requestError) {
      setError(
        requestError.message
      );

    } finally {
      setLoading(false);
    }
  };


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


  return (
    <section className="clock-page">
      <div className="page-header">
        <div>
          <h1>
            Clock In / Out
          </h1>

          <p>
            Record employee attendance.
          </p>
        </div>
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="clock-card">
        <div className="clock-icon">
          <Clock3 size={30} />
        </div>

        <span className="clock-date">
          {formattedDate}
        </span>

        <strong className="clock-time">
          {formattedTime}
        </strong>

        <span className="clock-status">
          {activeLog
            ? "Currently clocked in"
            : "Currently clocked out"}
        </span>

        <button
          type="button"
          className={
            activeLog
              ? "clock-button clock-out"
              : "clock-button"
          }
          disabled={loading}
          onClick={
            activeLog
              ? handleClockOut
              : handleClockIn
          }
        >
          {loading
            ? "Saving..."
            : activeLog
              ? "Clock Out"
              : "Clock In"}
        </button>
      </div>

      <div className="data-card">
        <div className="section-heading">
          <h2>
            Recent Time Logs
          </h2>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Clock In
                </th>

                <th>
                  Clock Out
                </th>

                <th>
                  Employee
                </th>
              </tr>
            </thead>

            <tbody>
              {timeLogs.map((log) => (
                <tr
                  key={log.timelog_id}
                >
                  <td>
                    {log.date}
                  </td>

                  <td>
                    {log.clock_in
                      ? new Date(
                          log.clock_in
                        ).toLocaleTimeString(
                          "en-AU"
                        )
                      : "-"}
                  </td>

                  <td>
                    {log.clock_out
                      ? new Date(
                          log.clock_out
                        ).toLocaleTimeString(
                          "en-AU"
                        )
                      : "Open"}
                  </td>

                  <td>
                    {log.employee_name ||
                      `${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`}
                  </td>
                </tr>
              ))}

              {timeLogs.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="empty-row"
                  >
                    No time logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


export default ClockInOut;