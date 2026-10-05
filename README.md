# Beerenberg Farm Time Management

React/Vite frontend and Flask backend. Azure CI installs dependencies, checks strict lint,
builds the frontend, validates Flask routes and runs isolated backend setup tests.
This repository contains CI, not an automated production deployment.

## Prerequisites

Node.js 24, Python 3.12, and a local MySQL database for development.
The shared database schema and migration readiness must be agreed with Rafat/backend owners.

## Frontend

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The frontend defaults to `/api`, which Vite proxies to
http://127.0.0.1:5000. To use another API endpoint, copy `.env.example` to `.env`
and set `VITE_API_BASE_URL`. Vite variables are visible in the built frontend;
use no secrets there. For production `/api` needs a reverse proxy on the hosting service.

## Backend development

```bash
cd Backend
python -m venv .venv
```

Activate with `.venv\Scripts\activate` on Windows, or `source .venv/bin/activate` on macOS/Linux.

```bash
python -m pip install -r requirements-dev.txt
```

Copy `Backend/.env.example` to `Backend/.env` and set your own database URL and random secrets.
Keep `APP_ENV=development`. From `Backend`, start:

```bash
python -m flask --app app run --host 127.0.0.1 --port 5000 --debug
```

The database must already be provisioned and its schema agreed with the team. The
existing migration is older than the current model set; do not assume it provisions
all current tables. `Backend/create_admin.py` is an existing legacy script importing
an absent `AdminUser` model; use the backend owner's account-provisioning process.

## Isolated checks

From the repository root, with the backend virtual environment activated:

```bash
npm run lint -- --max-warnings=0
npm run build
python -m pip check
python -m pytest --junitxml=test-results/backend.xml
```

For a Flask route/startup check, from `Backend`:

```bash
# macOS/Linux
APP_ENV=testing FLASK_SKIP_DOTENV=1 python -m flask --app app routes
# PowerShell
$env:APP_ENV="testing"
$env:FLASK_SKIP_DOTENV="1"
python -m flask --app app routes
```

Testing uses an in-memory SQLite database and ignores the development `.env`,
`DATABASE_URL`, and secrets. Setup tests create/drop tables only in isolated test
instances. Starting a testing server does not provision tables automatically.
These checks verify environment setup and HTTP startup; they are not complete
feature acceptance tests and do not validate MySQL migration parity.

See [Azure setup and handover](docs/AZURE_DEVOPS_SETUP.md).
