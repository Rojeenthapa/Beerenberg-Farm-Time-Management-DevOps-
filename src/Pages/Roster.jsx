import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

import "../styles/Roster.css";

function Roster() {
  const [showModal, setShowModal] = useState(false);

  const [shifts, setShifts] = useState([
    {
      id: 1,
      day: 16,
      title: "Irrigation",
      type: "irrigation",
    },
    {
      id: 2,
      day: 17,
      title: "Fertilizer Application",
      type: "fertilizer",
    },
    {
      id: 3,
      day: 20,
      title: "Harvesting",
      type: "harvesting",
    },
  ]);

  const [newShift, setNewShift] = useState({
    title: "",
    day: "",
    type: "irrigation",
  });

  // Calendar weeks
  const calendar = [
    [
      { day: 28, outside: true },
      { day: 29, outside: true },
      { day: 30, outside: true },
      { day: 1 },
      { day: 2 },
      { day: 3 },
      { day: 4 },
    ],

    [
      { day: 5 },
      { day: 6 },
      { day: 7 },
      { day: 8 },
      { day: 9 },
      { day: 10 },
      { day: 11 },
    ],

    [
      { day: 12 },
      { day: 13 },
      { day: 14 },
      { day: 15 },
      { day: 16 },
      { day: 17 },
      { day: 18 },
    ],

    [
      { day: 19 },
      { day: 20 },
      { day: 21 },
      { day: 22 },
      { day: 23 },
      { day: 24 },
      { day: 25 },
    ],

    [
      { day: 26 },
      { day: 27 },
      { day: 28 },
      { day: 29 },
      { day: 30 },
      { day: 31 },
      { day: 1, outside: true },
    ],

    [
      { day: 2, outside: true },
      { day: 3, outside: true },
      { day: 4, outside: true },
      { day: 5, outside: true },
      { day: 6, outside: true },
      { day: 7, outside: true },
      { day: 8, outside: true },
    ],
  ];

  const weekdays = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  // Find shifts for a specific day
  const getShiftsForDay = (day, outside) => {
    if (outside) {
      return [];
    }

    return shifts.filter((shift) => shift.day === day);
  };

  // Add new shift
  const handleAddShift = (e) => {
    e.preventDefault();

    if (!newShift.title || !newShift.day) {
      return;
    }

    const shift = {
      id: Date.now(),
      title: newShift.title,
      day: Number(newShift.day),
      type: newShift.type,
    };

    setShifts((currentShifts) => [
      ...currentShifts,
      shift,
    ]);

    setNewShift({
      title: "",
      day: "",
      type: "irrigation",
    });

    setShowModal(false);
  };

  return (
    <div className="roster-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="roster-page-header">

        <h1>Roster</h1>

        <button
          type="button"
          className="add-shift-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={17} />

          <span>Add Shift</span>
        </button>

      </div>


      {/* =====================================
          CALENDAR CARD
      ===================================== */}

      <section className="roster-calendar-card">

        {/* CALENDAR TOP */}

        <div className="calendar-toolbar">

          <div className="calendar-navigation">

            <button
              type="button"
              className="calendar-arrow-btn"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              type="button"
              className="calendar-arrow-btn"
            >
              <ChevronRight size={17} />
            </button>

            <h2>May 2024</h2>

          </div>


          <button
            type="button"
            className="today-btn"
          >
            Today
          </button>

        </div>


        {/* =====================================
            WEEK DAY NAMES
        ===================================== */}

        <div className="calendar-weekdays">

          {weekdays.map((day) => (
            <div
              key={day}
              className="weekday"
            >
              {day}
            </div>
          ))}

        </div>


        {/* =====================================
            CALENDAR
        ===================================== */}

        <div className="calendar-grid">

          {calendar.flat().map((date, index) => {

            const dayShifts = getShiftsForDay(
              date.day,
              date.outside
            );

            return (
              <div
                key={index}
                className={`calendar-cell ${
                  date.outside
                    ? "outside-month"
                    : ""
                }`}
              >

                <span className="calendar-date">
                  {date.day}
                </span>


                {/* SHIFT EVENTS */}

                <div className="calendar-events">

                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`calendar-event ${shift.type}`}
                    >
                      {shift.title}
                    </div>
                  ))}

                </div>

              </div>
            );
          })}

        </div>

      </section>


      {/* =====================================
          ADD SHIFT MODAL
      ===================================== */}

      {showModal && (

        <div className="roster-modal-overlay">

          <div className="roster-modal">

            {/* MODAL HEADER */}

            <div className="roster-modal-header">

              <h2>Add Shift</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* FORM */}

            <form onSubmit={handleAddShift}>

              {/* SHIFT NAME */}

              <div className="roster-form-group">

                <label htmlFor="shiftTitle">
                  Shift / Activity
                </label>

                <input
                  id="shiftTitle"
                  type="text"
                  placeholder="Example: Irrigation"
                  value={newShift.title}
                  onChange={(e) =>
                    setNewShift({
                      ...newShift,
                      title: e.target.value,
                    })
                  }
                />

              </div>


              {/* DAY */}

              <div className="roster-form-group">

                <label htmlFor="shiftDay">
                  Day
                </label>

                <input
                  id="shiftDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Example: 21"
                  value={newShift.day}
                  onChange={(e) =>
                    setNewShift({
                      ...newShift,
                      day: e.target.value,
                    })
                  }
                />

              </div>


              {/* SHIFT TYPE */}

              <div className="roster-form-group">

                <label htmlFor="shiftType">
                  Type
                </label>

                <select
                  id="shiftType"
                  value={newShift.type}
                  onChange={(e) =>
                    setNewShift({
                      ...newShift,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="irrigation">
                    Irrigation
                  </option>

                  <option value="fertilizer">
                    Fertilizer
                  </option>

                  <option value="harvesting">
                    Harvesting
                  </option>

                </select>

              </div>


              {/* BUTTONS */}

              <div className="roster-modal-actions">

                <button
                  type="button"
                  className="cancel-shift-btn"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-shift-btn"
                >
                  Add Shift
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Roster;