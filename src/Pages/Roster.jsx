import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X
} from "lucide-react";

import {
  apiRequest,
  getStoredUser
} from "../api";

import "../styles/Roster.css";


const EMPTY_SHIFT = {
  employee_id: "",
  date: "",
  start_time: "08:00",
  end_time: "16:00",
  status: "Scheduled"
};


function Roster() {
  const currentUser = getStoredUser();

  const isAdmin = Boolean(
    currentUser?.is_admin
  );

  const today = new Date();

  const [calendarDate, setCalendarDate] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

  const [shifts, setShifts] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editingShiftId, setEditingShiftId] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_SHIFT);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  const calendarYear =
    calendarDate.getFullYear();

  const calendarMonth =
    calendarDate.getMonth();


  const monthLabel =
    calendarDate.toLocaleDateString(
      "en-AU",
      {
        month: "long",
        year: "numeric"
      }
    );


  const getCalendarDays = () => {
    const firstDay = new Date(
      calendarYear,
      calendarMonth,
      1
    ).getDay();

    const daysInMonth = new Date(
      calendarYear,
      calendarMonth + 1,
      0
    ).getDate();

    const previousMonthDays =
      new Date(
        calendarYear,
        calendarMonth,
        0
      ).getDate();

    const days = [];

    for (
      let index = firstDay - 1;
      index >= 0;
      index -= 1
    ) {
      days.push({
        day: previousMonthDays - index,
        date: null,
        outside: true
      });
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {
      const dateValue = [
        calendarYear,
        String(calendarMonth + 1)
          .padStart(2, "0"),
        String(day)
          .padStart(2, "0")
      ].join("-");

      days.push({
        day,
        date: dateValue,
        outside: false
      });
    }

    while (days.length % 7 !== 0) {
      days.push({
        day: days.length + 1,
        date: null,
        outside: true
      });
    }

    return days;
  };


  const calendarDays = useMemo(
    getCalendarDays,
    [
      calendarYear,
      calendarMonth
    ]
  );


  const loadEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    const response = await apiRequest(
      "/employees?status=Active"
    );

    const employeeList = Array.isArray(
      response
    )
      ? response
      : response.employees || [];

    setEmployees(employeeList);
  };


  const loadShifts = async () => {
    const monthStart = [
      calendarYear,
      String(calendarMonth + 1)
        .padStart(2, "0"),
      "01"
    ].join("-");

    const lastDay = new Date(
      calendarYear,
      calendarMonth + 1,
      0
    ).getDate();

    const monthEnd = [
      calendarYear,
      String(calendarMonth + 1)
        .padStart(2, "0"),
      String(lastDay)
        .padStart(2, "0")
    ].join("-");

    const response = await apiRequest(
      `/shifts?start_date=${monthStart}&end_date=${monthEnd}`
    );

    setShifts(
      Array.isArray(response)
        ? response
        : response.shifts || []
    );
  };


  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadEmployees(),
        loadShifts()
      ]);

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [
    calendarYear,
    calendarMonth,
    isAdmin
  ]);


  const getShiftsForDate = (dateValue) => {
    return shifts.filter(
      (shift) =>
        shift.date === dateValue
    );
  };


  const handlePreviousMonth = () => {
    setCalendarDate(
      new Date(
        calendarYear,
        calendarMonth - 1,
        1
      )
    );
  };


  const handleNextMonth = () => {
    setCalendarDate(
      new Date(
        calendarYear,
        calendarMonth + 1,
        1
      )
    );
  };


  const handleToday = () => {
    const current = new Date();

    setCalendarDate(
      new Date(
        current.getFullYear(),
        current.getMonth(),
        1
      )
    );
  };


  const openAddModal = (dateValue = "") => {
    if (!isAdmin) {
      return;
    }

    setEditingShiftId(null);

    setForm({
      ...EMPTY_SHIFT,
      date: dateValue
    });

    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };


  const openEditModal = (shift) => {
    if (!isAdmin) {
      return;
    }

    setEditingShiftId(
      shift.shift_id
    );

    setForm({
      employee_id: String(
        shift.employee_id
      ),
      date: shift.date,
      start_time: shift.start_time
        .slice(0, 5),
      end_time: shift.end_time
        .slice(0, 5),
      status: shift.status
    });

    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };


  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingShiftId(null);
    setForm(EMPTY_SHIFT);
  };


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


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const isEditing =
      editingShiftId !== null;

    const endpoint = isEditing
      ? `/shifts/${editingShiftId}`
      : "/shifts";

    try {
      await apiRequest(
        endpoint,
        {
          method: isEditing
            ? "PUT"
            : "POST",
          body: JSON.stringify({
            employee_id: Number(
              form.employee_id
            ),
            date: form.date,
            start_time: form.start_time,
            end_time: form.end_time,
            status: form.status
          })
        }
      );

      setSuccessMessage(
        isEditing
          ? "Shift updated successfully."
          : "Shift assigned successfully."
      );

      closeModal();
      await loadShifts();

    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (shiftId) => {
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this shift?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await apiRequest(
        `/shifts/${shiftId}`,
        {
          method: "DELETE"
        }
      );

      await loadShifts();

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  };


  const isToday = (dateValue) => {
    const current = new Date()
      .toISOString()
      .slice(0, 10);

    return current === dateValue;
  };


  return (
    <section className="roster-page">
      <div className="roster-page-header">
        <div>
          <h1>
            Roster
          </h1>

          <p>
            Assign and view employee shifts.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="add-shift-btn"
            onClick={() => {
              openAddModal();
            }}
          >
            <Plus size={17} />

            <span>
              Add Shift
            </span>
          </button>
        )}
      </div>

      {error && (
        <div className="roster-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="roster-success">
          {successMessage}
        </div>
      )}

      <section className="roster-calendar-card">
        <div className="calendar-toolbar">
          <div className="calendar-navigation">
            <button
              type="button"
              className="calendar-arrow-btn"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="calendar-arrow-btn"
              onClick={handleNextMonth}
            >
              <ChevronRight size={18} />
            </button>

            <h2>
              {monthLabel}
            </h2>
          </div>

          <button
            type="button"
            className="today-btn"
            onClick={handleToday}
          >
            Today
          </button>
        </div>

        <div className="calendar-weekdays">
          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat"
          ].map((day) => (
            <div
              key={day}
              className="weekday"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map(
            (calendarDay, index) => {
              const dayShifts =
                calendarDay.date
                  ? getShiftsForDate(
                      calendarDay.date
                    )
                  : [];

              return (
                <div
                  key={`${calendarDay.date || "outside"}-${index}`}
                  className={
                    calendarDay.outside
                      ? "calendar-cell outside-month"
                      : isToday(
                          calendarDay.date
                        )
                        ? "calendar-cell today-cell"
                        : "calendar-cell"
                  }
                >
                  <div className="calendar-date-row">
                    <span className="calendar-date">
                      {calendarDay.day}
                    </span>

                    {isAdmin &&
                      calendarDay.date && (
                        <button
                          type="button"
                          className="calendar-add-btn"
                          title="Add shift"
                          onClick={() => {
                            openAddModal(
                              calendarDay.date
                            );
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      )}
                  </div>

                  <div className="calendar-events">
                    {dayShifts.map(
                      (shift) => (
                        <div
                          key={
                            shift.shift_id
                          }
                          className={
                            "calendar-event " +
                            shift.status
                              .toLowerCase()
                          }
                        >
                          <div>
                            <strong>
                              {shift.display_id ||
                                shift.employee_id}
                            </strong>

                            <span>
                              {shift.employee_name ||
                                "Assigned employee"}
                            </span>

                            <small>
                              {shift.start_time
                                .slice(0, 5)}
                              {" - "}
                              {shift.end_time
                                .slice(0, 5)}
                            </small>
                          </div>

                          {isAdmin && (
                            <div className="calendar-event-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  openEditModal(
                                    shift
                                  );
                                }}
                              >
                                <Pencil size={12} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleDelete(
                                    shift.shift_id
                                  );
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      {showModal && isAdmin && (
        <div
          className="roster-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="roster-modal">
            <div className="roster-modal-header">
              <h2>
                {editingShiftId !== null
                  ? "Edit Shift"
                  : "Assign Shift"}
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

            <form onSubmit={handleSubmit}>
              <div className="roster-form-group">
                <label htmlFor="employee_id">
                  Employee
                </label>

                <select
                  id="employee_id"
                  name="employee_id"
                  value={form.employee_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select employee
                  </option>

                  {employees.map((employee) => (
                    <option
                      key={
                        employee.employee_id
                      }
                      value={
                        employee.employee_id
                      }
                    >
                      {employee.display_id} —{" "}
                      {employee.first_name}{" "}
                      {employee.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="roster-form-group">
                <label htmlFor="date">
                  Date
                </label>

                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="roster-form-grid">
                <div className="roster-form-group">
                  <label htmlFor="start_time">
                    Start Time
                  </label>

                  <input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="roster-form-group">
                  <label htmlFor="end_time">
                    End Time
                  </label>

                  <input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="roster-form-group">
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                >
                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              <div className="roster-modal-actions">
                <button
                  type="button"
                  className="cancel-shift-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-shift-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingShiftId !== null
                      ? "Save Changes"
                      : "Assign Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Roster;