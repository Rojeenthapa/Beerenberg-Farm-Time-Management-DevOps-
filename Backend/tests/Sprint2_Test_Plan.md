# Sprint 2 Test Plan — Beerenberg Farm Time Management System

**Owner:** Shrut Hitesh Teli (Architect/Testing)
**Sprint:** Sprint 2 (14 September – 4 October 2026)
**Status:** Complete — all planned cases built, run and passing

## 1. Scope

This plan covers automated test coverage for every feature delivered in
Sprint 2 against the real Flask backend: authentication, staff/employee
management, shift scheduling, clock in/out, hours reporting and payroll
calculation.

Mid-sprint, the backend's authentication layer was rewritten from
session+email login to JWT+login_id login (Employee/User model split
replacing the original AdminUser model). This plan and its test cases
target the **current, rewritten backend**, not the original design.

## 2. Approach

- **Framework:** pytest, using Flask's `test_client()` against an
  in-memory SQLite database (`sqlite:///:memory:`), created fresh per test
  via a shared `app` fixture (`Backend/tests/conftest.py`).
- **Style:** integration-level tests hitting real HTTP routes
  (`/api/login`, `/api/employees`, `/api/shifts`, `/api/timelogs/...`,
  `/api/hours`, `/api/payroll`), not unit tests against isolated functions,
  so each test exercises the real request/response contract the frontend
  depends on.
- **Data:** all expected values are hand-calculated from the real
  calculation logic in `app/routes.py` (`calculate_worked_hours`,
  `calculate_break_hours`, `calculate_payroll_amounts`), not guessed.
- **Execution:** `python -m pytest -v` locally during development; the same
  suite runs in the Azure Pipelines backend job on every push and pull
  request.

## 3. Test Environment

- Python 3.12/3.13, Flask + Flask-SQLAlchemy + Flask-JWT-Extended +
  Flask-Migrate + Flask-CORS
- SQLite in-memory database (no shared state between tests)
- Local: VS Code + PowerShell terminal
- CI: Azure Pipelines, isolated job, results published per run

## 4. Test Cases and Coverage

| Work Item | Area | File | Tests |
|---|---|---|---|
| #39, #42 | Login success/failure, access control, token behaviour | `test_auth.py` | 10 |
| #47, #51, #53, #56 | Employee input validation, list display, update persistence, deactivation | `test_employees.py` | 13 |
| #88 | Clock-in/out, duplicate clock-in rejection | `test_clockinout.py` | 6 |
| #99 | Shift creation and view per staff member | `test_shifts.py` | 7 |
| #93 | Hours totals match known sample data | `test_hours.py` | 4 |
| #104 | Payroll calculations checked against worked examples | `test_payroll.py` | 4 |

**Total: 44 new/rebuilt tests**, plus the existing `test_environment.py`
bootstrap tests = **59 tests**.

## 5. Entry Criteria

- Backend routes and models for the feature under test are merged to `main`
- Local branch is synced with `main` (confirmed via `git log` / `git status`)

## 6. Exit Criteria

- 100% of the above suite passes locally and in CI
- No test relies on a guessed field name, route, or response shape — every
  assertion is traced back to the actual route/model source before being
  written

## 7. Results (as of 6 October 2026)

**59 / 59 passed**, 0 failures, run both locally and verified against the
real current `main` branch.

## 8. Known Limitations / Out of Scope

- No load/concurrency testing against SQLite (tracked separately as
  technical debt — see Technical Debt & Residual Risk)
- No frontend/UI test automation — this plan covers backend API behaviour
  only
- JWT token storage approach on the frontend (localStorage vs. httpOnly
  cookie) is not covered here; it's a frontend/security decision tracked
  separately

## 9. Risk Note

The original 6 test files (login/session/input/list/update/deactivate)
were written against the pre-rewrite `AdminUser` model and became
non-functional (`ImportError`) once the backend was rewritten mid-sprint.
They were replaced outright rather than patched, since the underlying
auth model changed completely. This is logged as a lesson for future
sprints: a backend contract change should trigger an immediate test-suite
review, not wait until the next test run surfaces the break.
