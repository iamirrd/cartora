# Development, configuration and troubleshooting

[Project setup](../README.md) · [راهنمای فارسی](../README.fa.md) · [API](API.md) · [Frontend](../frontend/README.md)

## Local backend with pip

Requires Python 3.14+ and an available PostgreSQL database. Copy `.env.example` to `.env`, configure credentials and create that database first.

Windows / PowerShell, without activating the environment:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver
```

Linux/macOS:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py runserver
```

Only start one backend on port 8000. Keep the React dev server in a separate terminal. Windows paths containing spaces or Persian characters work; quote absolute paths when using them in commands.

## Environment configuration

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Private application secret; replace the example placeholder |
| `DJANGO_DEBUG` | Local development switch; takes priority over legacy `DEBUG` |
| `ALLOWED_HOSTS` | Comma-separated hostnames, without scheme or port |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL credentials |
| `POSTGRES_HOST`, `POSTGRES_PORT` | Database address; Compose uses `db:5432` inside the web container |
| `ENABLE_MOCK_PAYMENTS` | Payment simulator; only effective when Django debug mode is enabled |
| `FIREBASE_ENABLED` | Optional Firebase initialization; keep false unless configured |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional absolute path to the Firebase service-account file |

Copy the example only when creating a new environment. Do not overwrite an existing `.env` with the example: that would replace working database credentials. Changing environment files requires a backend restart; an already running process may retain old values.

`DJANGO_DEBUG` avoids collisions with generic environment variables such as Windows tooling's `DEBUG=release`. For a public deployment set `DJANGO_DEBUG=False` explicitly.

## Docker behavior

The Compose stack contains PostgreSQL and the Django API. The frontend runs separately with npm. Startup runs migrations, collects static files and starts Gunicorn. The project directory is bind-mounted for local development; PostgreSQL and media use named volumes.

```bash
docker compose ps
docker compose logs -f web
docker compose stop
docker compose up -d
```

After changing `.env`, recreate the web container:

```bash
docker compose up -d --force-recreate web
```

Changing Python dependencies requires rebuilding with `docker compose up -d --build web`. Changing source/templates requires restarting Gunicorn with `docker compose restart web`. For changed static assets, rerun `docker compose exec web python manage.py collectstatic --noinput` or recreate the web container so its startup command does that.

Port 5432 must be available for the bundled database. Existing PostgreSQL volume credentials are not changed merely by editing `.env`. Keep matching credentials or change the database user's password deliberately. Avoid removing volumes just to fix a connection error: they hold data.

## Verification

Use `uv run --frozen python` below, or replace it with your virtual environment's Python executable.

```bash
uv run --frozen python manage.py check
uv run --frozen python frontend/tests/backend_contract.py
```

The contract script overrides the database with in-memory SQLite **before Django setup**, disables Firebase and uses isolated test settings. It exercises real views for registration/login response consistency, session login and CSRF, product-review filtering, order ownership, checkout, cancelled/retried payments and idempotent stock updates. It does not test PostgreSQL locking or simultaneous purchases.

Additional backend checks, with the development database available:

```bash
uv run --frozen python manage.py makemigrations --check --dry-run
uv run --frozen python manage.py spectacular --validate --fail-on-warn --file schema.yml
```

`schema.yml` is a generated artifact; do not commit it accidentally unless you intend to maintain a tracked schema.

From `frontend/`:

```bash
npm test
npm run build
npm run test:e2e
```

- Node tests check HTTP errors, token renewal/concurrency, retry boundaries and DRF pagination.
- Playwright tests run the real React app with controlled API responses; they cover shopping flows, account features, responsive layouts and tall image containment.
- Browser tests require a browser installation and port 5175. See the [browser setup](../frontend/README.md#browser-tests).
- CI runs these checks on GitHub; it does not deploy the project or use your application's database/secrets.

For final manual verification, use a real local PostgreSQL catalog and walk through registration, selection, quantity changes, saved addresses, checkout, cancelled payment, retry and inventory inspection. Use a second account to check ownership isolation. The Persian [learning guide](../frontend/docs/LEARNING.md) includes that checklist.

## Dependency maintenance

`pyproject.toml` declares backend dependencies, `uv.lock` locks them and `requirements.txt` is the Docker/pip export. Keep all three consistent when intentionally changing dependencies:

```bash
uv lock
uv export --frozen --no-dev --no-hashes --no-emit-project --no-header --output-file requirements.txt
```

`frontend/package-lock.json` is tracked. Use `npm ci` for a clean install; use `npm install <package>` when intentionally changing frontend dependencies and commit both package files. The backend is an application, not a distributable Python package.

## Troubleshooting

### Plain admin/login page or giant theme icons

Open `/static/admin/css/base.css` directly. A 404 means the issue is asset serving, not the product UI. For local development, set `DJANGO_DEBUG=True`, stop the old backend and start it again. Collect static assets when using the Compose/Gunicorn development stack:

```bash
python manage.py collectstatic --noinput
```

`runserver` can find installed apps' static assets in debug mode. The URL configuration serves collected static/media only in debug mode for the local Gunicorn setup. `collectstatic` by itself does not add production file serving.

If the old English Allauth layout appears instead of Cartora's custom login, confirm the running process uses this checkout and `TEMPLATES[0]['DIRS']` contains the project's `templates` directory. Stop stale servers, particularly `--noreload` runs, before starting another instance.

On Windows, inspect port 8000 with `netstat -ano -p tcp | findstr :8000`. Stop the verified Django instance from its terminal with Ctrl+C. Do not terminate unrelated Python processes.

### Frontend 500, unreadable response or network error

Check `http://127.0.0.1:8000/api/products/products/`. If it is unavailable, start the backend and inspect its terminal. A Vite proxy failure can produce a 500 even when Django never received the request. If Django returns 500, its log contains the real exception. Verify PostgreSQL credentials, database existence and migrations.

### Product missing from the storefront

The public API requires an active product **and** active category/brand. In admin, open the record to edit `Is active`; the list's green/red icon is a status display. Also clear storefront filters, check the current page and refresh after admin changes. Variants/inventory are needed for purchases, not for listing the product.

### Unexpected product image

The primary active image is used as the cover; otherwise the first image is used. Adding an image associates it with the selected product and does not create a new product. Only mark the intended cover as primary.

### Unable to add to the cart or pay

Login is required, the chosen variant must be active, and inventory must be active with enough quantity. A duplicate cart variant must be updated instead of posted twice. Mock payments require debug mode and `ENABLE_MOCK_PAYMENTS=True`, positive order totals and available stock. After checkout, continue from the existing order rather than recreating it when payment fails.

### PowerShell blocks npm.ps1 / Python output has encoding errors

Use `npm.cmd` instead of changing the system execution policy. For Persian paths and output, `python -X utf8 ...` enables Python's UTF-8 mode.

## Optional integrations

Firebase push requires `FIREBASE_ENABLED=True` and service-account credentials. Keep credentials outside Git; in Docker mount them read-only. In-app notifications do not require Firebase.

Google/GitHub Allauth providers require configured OAuth applications and Social Applications in Django admin, linked to Site ID 1. Callback URLs are `/accounts/google/login/callback/` and `/accounts/github/login/callback/`. These are session routes, not React JWT login endpoints.

## Deployment boundaries

The bundled Compose file is a development/demo setup. Public deployment needs `DJANGO_DEBUG=False`, a private secret, explicit hosts, HTTPS, secure cookie configuration, a production email backend, a shared cache for throttling, media/static serving and backups. Static serving is not bundled for production; configure a web server or a supported middleware. Do not enable debug mode merely to serve files publicly.

Serve the frontend's `dist/` with a fallback to `index.html` for React routes. Route `/api/` and `/media/` correctly; the Vite proxy is development-only. Uploading the repository or using GitHub Pages alone does not run Django/PostgreSQL.

The payment gateway is mock-only. Email verification is disabled by default. Pending payments do not reserve inventory, and a real gateway, payment expiry, automatic cancellation/refunds and production operations are outside the current implementation.

## References

- [Playwright on GitHub Actions](https://playwright.dev/docs/ci-intro)
- [GitHub setup-python action](https://github.com/actions/setup-python)
- [GitHub setup-node action](https://github.com/actions/setup-node)
