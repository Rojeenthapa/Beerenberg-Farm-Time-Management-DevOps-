# Beerenberg Farm Time Management

React/Vite frontend with a Flask/SQLAlchemy API. This package implements Om's
project setup (#72), CI configuration (#73) and application dev/test setup (#74).

## Start here

- [Upload and activate in Azure DevOps](docs/AZURE_DEVOPS_SETUP.md)
- [Changed files, ownership and remaining work](docs/CHANGES.md)
- [Validation results](docs/VERIFICATION.md)

Use Node.js **24.x**, npm and Python **3.12.x**. Keep the existing package lock.

## Windows PowerShell: first setup

Open PowerShell in this folder (the one containing `package.json`):

```powershell
npm ci
Copy-Item .env.example .env.local
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r Backend/requirements-dev.txt
Copy-Item Backend/.env.example Backend/.env
Set-Location Backend
..\.venv\Scripts\python.exe -m flask --app app init-dev-db
..\.venv\Scripts\python.exe create_admin.py
..\.venv\Scripts\python.exe -m flask --app app run --debug --host 127.0.0.1 --port 5000
```

`create_admin.py` asks for an email, first and last name and a password.
It creates a **local demo account**, using the supplied email as its login ID.
Its employee record has placeholder pay values of zero, for local testing only.
Do not use these fixtures for real payroll.

Open another terminal in the project root:

```powershell
npm run dev
```

Open <http://127.0.0.1:5173>. API health is <http://127.0.0.1:5000/api/health>.

## macOS/Linux: first setup

```bash
npm ci
cp .env.example .env.local
python3.12 -m venv .venv
.venv/bin/python -m pip install -r Backend/requirements-dev.txt
cp Backend/.env.example Backend/.env
cd Backend
../.venv/bin/python -m flask --app app init-dev-db
../.venv/bin/python create_admin.py
../.venv/bin/python -m flask --app app run --debug --host 127.0.0.1 --port 5000
```

In another terminal in the project root, run `npm run dev`.

## Development and testing

| Environment | Selection | Database | Purpose |
| --- | --- | --- | --- |
| Development | `APP_ENV=development` (default) | `Backend/instance/beerenberg_dev.db` by default; configurable `DATABASE_URL` | Local app development |
| Testing | `create_app("testing")` or `APP_ENV=testing` | New SQLite in-memory DB per application instance | Automated tests and CI |
| Production configuration | `APP_ENV=production` | Explicit `DATABASE_URL` required | Config validation only; production deployment is outside these tasks |

Backend dotenv loading uses **Backend/.env** regardless of where Python is
started. Exported environment variables take priority. Testing ignores the
normal database URL and secrets and does not load Backend/.env. Tests reject
an override that points at a persistent database.

Frontend `VITE_API_BASE_URL` defaults to `/api`. Vite proxies it to port 5000 in
development. To use a separately hosted API, set it to the full API URL ending
in `/api`, then restart Vite or rebuild. Vite variables are public browser
configuration; do not put passwords or tokens in them. The deployed frontend
requires a same-origin `/api` backend or a configured external API; Azure CI
publishes the frontend artifact but does not deploy an application.

Development CORS accepts only localhost/127.0.0.1 port 5173 by default. Change
`CORS_ORIGINS` to a comma-separated list if your frontend address changes.

## Shared MySQL environment: coordinate with Rafat (#75)

The app still supports `mysql+pymysql://...` via `DATABASE_URL` in Backend/.env.
Rafat must supply the MySQL service, development credentials, current schema
and agreed fixtures. Use a development-only database/account. The local
`init-dev-db` and demo admin commands intentionally refuse MySQL.

**The included migration is stale**: it creates only two tables, lacks current
fields such as `employee_code` and `login_id`, and includes columns that are no
longer in the models. Do not assume `flask db upgrade` provides the current
shared schema. Rafat/backend owners must reconcile it. `init-dev-db` uses the
current model metadata for disposable local SQLite only; it does not repair
existing databases or replace a migration history. Automated tests here do
not validate the MySQL schema or migrations.

## Run the same checks as CI

From the project root, in PowerShell:

```powershell
npm run lint -- --max-warnings=0
npm run build
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m pytest --junitxml=test-results/backend.xml
```

On macOS/Linux use `.venv/bin/python` for the Python commands.
Tests always select isolated testing configuration in their fixtures; exporting
`APP_ENV=testing` and `FLASK_SKIP_DOTENV=1` is also recommended in CI (the YAML
already does this).

## Repository layout

```text
src/                  React application and shared API client
Backend/app/          Flask application factory, config, models and API
Backend/migrations/   Existing migration history; needs team reconciliation
Backend/tests/        Dev/test setup checks and HTTP startup smoke test
azure-pipelines.yml   Frontend/backend CI jobs
.env.example          Public frontend configuration template
Backend/.env.example  Local backend configuration template
docs/                 Azure setup, changes and validation evidence
```

Never commit `.env`, `.env.local`, `.venv`, development DBs or generated test
results. They are ignored. Example files contain local placeholders only.

## Team testing

The new tests cover setup/environment reliability for Om's tasks. Shrut and the
team still own the feature test plan and login/staff/roster/payroll acceptance
cases. Add backend cases under `Backend/tests` so CI discovers them. Once the
team selects a frontend test runner, add its test command to the frontend CI
job. The current frontend checks are lint and build.
