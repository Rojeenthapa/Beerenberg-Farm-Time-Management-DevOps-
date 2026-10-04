import {
  useEffect,
  useState
} from "react";

import {
  Plus,
  Trash2,
  X
} from "lucide-react";

import {
  apiRequest
} from "../api";

import "../styles/Roster.css";


function Roster({
  currentUser
}) {
  const [shifts, setShifts] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [form, setForm] =
    useState({
      employee_id: "",
      date: "",
      start_time: "",
      end_time: "",
      status: "Scheduled"
    });

  const isAdmin = Boolean(
    currentUser?.is_admin
  );


  const loadShifts = async () => {
    try {
      const response = await apiRequest(
        "/shifts"
      );

      setShifts(
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


  const loadEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const response = await apiRequest(
        "/employees?status=Active"
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
    }
  };


  useEffect(() => {
    loadShifts();
    loadEmployees();
  }, []);


  const handleChange = (event) => {
    const {
      name,
      value
    } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await apiRequest(
        "/shifts",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            employee_id: Number(
              form.employee_id
            )
          })
        }
      );

      setShowModal(false);

      setForm({
        employee_id: "",
        date: "",
        start_time: "",
        end_time: "",
        status: "Scheduled"
      });

      await loadShifts();

    } catch (requestError) {
      setError(
        requestError.message
      );
    }
  };


  const deleteShift = async (shiftId) => {
    if (
      !window.confirm(
        "Delete this shift?"
      )
    ) {
      return;
    }

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


  return (
    <section className="roster-page">
      <div className="page-header">
        <div>
          <h1>
            Roster
          </h1>

          <p>
            Manage scheduled shifts.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setShowModal(true);
            }}
          >
            <Plus size={16} />
            Add Shift
          </button>
        )}
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="data-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Employee
                </th>

                <th>
                  Start
                </th>

                <th>
                  End
                </th>

                <th>
                  Status
                </th>

                {isAdmin && (
                  <th>
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {shifts.map((shift) => (
                <tr
                  key={shift.shift_id}
                >
                  <td>
                    {shift.date}
                  </td>

                  <td>
                    {shift.employee_name}
                  </td>

                  <td>
                    {shift.start_time}
                  </td>

                  <td>
                    {shift.end_time}
                  </td>

                  <td>
                    {shift.status}
                  </td>

                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          deleteShift(
                            shift.shift_id
                          );
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {shifts.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      isAdmin
                        ? "6"
                        : "5"
                    }
                    className="empty-row"
                  >
                    No shifts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>
                Add Shift
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="form-grid"
              onSubmit={handleSubmit}
            >
              <label>
                Employee
                <select
                  name="employee_id"
                  value={form.employee_id}
                  required
                  onChange={handleChange}
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
                      {employee.display_id}
                      {" — "}
                      {employee.first_name}
                      {" "}
                      {employee.last_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  required
                  onChange={handleChange}
                />
              </label>

              <label>
                Start Time
                <input
                  name="start_time"
                  type="time"
                  value={form.start_time}
                  required
                  onChange={handleChange}
                />
              </label>

              <label>
                End Time
                <input
                  name="end_time"
                  type="time"
                  value={form.end_time}
                  required
                  onChange={handleChange}
                />
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option>
                    Scheduled
                  </option>

                  <option>
                    Completed
                  </option>

                  <option>
                    Cancelled
                  </option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Shift
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