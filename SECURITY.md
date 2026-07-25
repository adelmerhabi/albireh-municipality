# Security policy

This is a public-facing municipal service. Resident requests can contain names,
phone numbers, locations, and private images, so suspected exposure must be
reported privately.

## Reporting a vulnerability

Do **not** open a public GitHub issue containing a vulnerability, credentials,
private URLs, or resident data.

Use GitHub's private vulnerability reporting for this repository when it is
enabled. Otherwise, contact the repository owner privately through their GitHub
profile and provide:

- a concise description and affected URL/component;
- reproduction steps using synthetic data;
- the impact and any suggested mitigation;
- whether credentials or resident information may be exposed.

Do not download, alter, retain, or publish real resident data while verifying a
report. Stop testing once the issue is demonstrated.

## Response priorities

The maintainers should treat these as urgent:

- access to resident requests or attachments without an admin session;
- authentication or session bypass;
- exposed Cloudflare, GitHub, D1, R2, or deployment credentials;
- unrestricted file upload or stored script execution;
- destructive database or storage operations;
- disclosure of passwords, phone numbers, identity documents, or private media.

Feature requests and ordinary bugs without a confidentiality, integrity, or
availability impact may be filed as regular Issues.

## Secrets and access

- Store production secrets only as Cloudflare Worker secrets.
- Never commit `.env` files, database exports, R2 exports, tokens, or password
  hashes intended for production.
- Give each employee an individual account and deactivate it when access is no
  longer required.
- Keep the bootstrap account for recovery, use a unique strong password, and do
  not use it for everyday editing.
- Rotate `ADMIN_SESSION_SECRET` and affected credentials immediately after a
  suspected leak. Rotation invalidates existing admin sessions.
- Restrict Cloudflare and GitHub organization access and enable MFA.

## Operational safeguards

- Run lint, tests, and the production build before deployment.
- Apply reviewed migrations and take a backup before schema changes.
- Periodically test D1 and R2 restoration.
- Review and delete closed resident requests according to `/privacy`.
- Use synthetic content in tests, screenshots, logs, and bug reports.
- Keep framework and Cloudflare dependencies updated after CI verification.

Only the current `main` branch is maintained. Security fixes should be deployed
to production promptly after review and verification.
