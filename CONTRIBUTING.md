# Contributing to Cartora

Start with the [README](README.md) or [راهنمای فارسی](README.fa.md), and use the [development guide](docs/DEVELOPMENT.md) for configuration and troubleshooting.

## Workflow

1. Create a branch for a focused change.
2. Keep backend responsibilities in the corresponding Django app and frontend features in `frontend/src/features/`.
3. Update documentation when changing behavior, setup or API contracts.
4. Run the checks relevant to the change and review `git diff` before opening a pull request.

Describe the problem, resulting behavior and validation in the pull request. Include before/after screenshots for UI changes when helpful. Report checks you could not run rather than claiming they passed.

## Checks

From the repository root:

```bash
uv run --frozen python manage.py check
uv run --frozen python frontend/tests/backend_contract.py
```

From `frontend/`:

```bash
npm test
npm run build
npm run test:e2e
```

Use `npm.cmd` on PowerShell when necessary. Browser installation and the differences between isolated tests and live verification are covered in the development guide. Use `npm run format` only when you intend to format the affected frontend files; avoid unrelated formatting changes.

## Files and data

Commit migrations and dependency lockfiles when they change intentionally. Do not commit `.env`, credentials, private keys, databases, uploaded media, dependencies, build output or test reports. `.env.example` must contain placeholders only. Keep personal catalog/account data out of screenshots.

Dependencies keep their own licenses. This repository has no project-wide license selected yet; do not assume the bundled font license applies to the application's source code.
