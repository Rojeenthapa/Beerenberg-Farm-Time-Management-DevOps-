import { useState, useEffect } from "react";
import "../styles/ClockInOut.css";

function ClockInOut() {
  const [clockedIn, setClockedIn] = useState(true);
  const [station, setStation] = useState("Packing Shed");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [activities, setActivities] = useState([
    {
      time: "07:02 AM",
      type: "Clock In",
      station: "Main Gate",
    },
    {
      time: "11:15 AM",
      type: "Clock Out",
      station: "Packing Shed",
    },
    {
      time: "11:48 AM",
      type: "Clock In",
      station: "Packing Shed",
    },
  ]);

  // ==========================================
  // UPDATE CLOCK EVERY SECOND
  // ==========================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // FORMAT CURRENT TIME
  // ==========================================

  const formattedTime = currentTime.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // ==========================================
  // FORMAT CURRENT DATE
  // ==========================================

  const formattedDate = currentTime.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ==========================================
  // CLOCK IN / CLOCK OUT
  // ==========================================

  const handleClock = () => {
    const newType = clockedIn ? "Clock Out" : "Clock In";

    const newActivity = {
      time: new Date().toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      type: newType,
      station: station,
    };

    setActivities((previousActivities) => [
      ...previousActivities,
      newActivity,
    ]);

    setClockedIn((previousState) => !previousState);
  };

  return (
    <div className="clock-page">
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="page-header">
        <h1>Clock In / Clock Out</h1>

        <p>{formattedDate}</p>
      </div>

      {/* ==========================================
          CLOCK CARD
      ========================================== */}

      <section className="clock-card">
        {/* Employee Avatar */}

        <div className="employee-avatar">
          JD
        </div>

        {/* Employee Information */}

        <h2>John Doe</h2>

        <p className="employee-role">
          Field Supervisor · EMP-001
        </p>

        {/* Current Time */}

        <div className="current-time">
          {formattedTime}
        </div>

        {/* ======================================
            STATUS
        ====================================== */}

        <div className="status-container">
          <span
            className={
              clockedIn
                ? "status active"
                : "status inactive"
            }
          >
            ● {clockedIn ? "Clocked In" : "Clocked Out"}
          </span>

          <span className="status compliance">
            ⚠ Compliance check
          </span>
        </div>

        {/* ======================================
            STATION
        ====================================== */}

        <div className="station-container">
          <label htmlFor="station">
            Station
          </label>

          <select
            id="station"
            value={station}
            onChange={(e) =>
              setStation(e.target.value)
            }
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

          {/* CLOCK BUTTON */}

          <button
            type="button"
            className={
              clockedIn
                ? "clock-out-btn"
                : "clock-in-btn"
            }
            onClick={handleClock}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </button>
        </div>
      </section>

      {/* ==========================================
          TODAY'S ACTIVITY
      ========================================== */}

      <section className="activity-card">
        <h3>Today's Activity</h3>

        <div className="activity-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Station</th>
              </tr>
            </thead>

            <tbody>
              {activities.map((activity, index) => (
                <tr key={index}>
                  <td>
                    {activity.time}
                  </td>

                  <td>
                    <span
                      className={
                        activity.type === "Clock In"
                          ? "activity-in"
                          : "activity-out"
                      }
                    >
                      {activity.type}
                    </span>
                  </td>

                  <td>
                    {activity.station}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Footer */}

        <div className="activity-footer">
          {activities.length} events recorded today
        </div>
      </section>
    </div>
  );
}

export default ClockInOut;