---
name: nodrift-standard
description: Production-grade coding standards for writing and changing code, covering environment and secret hygiene (.env, .gitignore), layered architecture boundaries (MVC/MVVM/Clean), lifecycle scripts, README upkeep, defensive error handling, tests, and an evidence-based self-review before finishing. Use when scaffolding a project, adding a feature, endpoint, config value, env variable or new structure, or before declaring any coding task complete. For tiny edits (typo, copy change, one-line fix) only the secret rules and a light version of the pre-completion check apply.
---

# Tech Lead & Senior Programmer Coding Standards

Enforce enterprise-grade craftsmanship, security guardrails, and clean-code principles on any technology stack, in proportion to the size of the change.

---

## 0. Precedence & Scope

When rules conflict, the higher one wins:
1. The user's explicit instructions.
2. The repository's established conventions: formatter and linter config, folder layout, build tooling (Makefile, `package.json` scripts, etc.), naming.
3. The `Conventions` field in `.agent-context/BLUEPRINT.md`.
4. This document: the default for new projects and new code where nothing is established.

In an existing repository, follow what is already there. Never restructure a project to match this document (for example, don't force `scripts/` into a repo that already uses a Makefile). When existing code violates a standard, mention it to the user and fix it only if asked or if it falls inside your change. The exception is a security problem such as a committed secret: report it right away.

The standards below are guardrails, not quotas. Scale effort to the change.

---

## 1. Environment & Secret Hygiene

**Files**
- `.env.example`: required, committed. Placeholder values only, with a comment explaining every variable. Never a real value.
- `.env`: local configuration. Never committed.
- `.env.local`: optional machine-specific overrides. Never committed. Many frameworks load it automatically (Next.js, Vite); elsewhere the config module must read it explicitly. It overrides `.env`. Document the load order in the config module or README.

**Gitignore first.** Before creating `.env` or `.env.local`, check `.gitignore`. Use a pattern that covers variants and keeps the example tracked:
```
.env*
!.env.example
```
`.gitignore` does nothing for files already tracked. Check with `git ls-files | grep -E '(^|/)\.env'`. If an env file with real values is tracked, tell the user: `git rm --cached` stops tracking it, but the history still contains it, so the secrets must be **rotated**. Don't rewrite history without asking.

**Single config entrypoint.** Read environment variables in one dedicated `config` module only. Business logic imports typed config and never calls `process.env`, `os.Getenv()`, or similar directly. Validate at startup and fail fast with a message that names the missing keys (never their values).

**Client-exposed variables are public.** Anything the framework bundles into client code (`NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`, `EXPO_PUBLIC_*`, ...) ends up in the browser. Never put secrets there.

**Keep the example in sync.** A new variable is added to `.env.example` (and to the README if it affects setup) in the same change.

**Never print secrets.** Don't output `.env` values, tokens, or keys into chat, logs, or commits. Check that variables exist by key name only:
```bash
sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env
```

---

## 2. Layer Separation (Architecture & Boundaries)

Define layers by **responsibility**, not folder names. Map the project's folders to these layers once, record the mapping in the blueprint's `Conventions` field, and follow it.

**Dependency direction:** Presentation → Domain → Data. Never the reverse. Domain code must not import UI or framework request objects.

- **Presentation** (views, pages, components, controllers, route handlers, ViewModels): renders UI and handles interaction. Handlers stay thin: validate input, delegate to the domain, shape the response. In MVVM the ViewModel belongs here, holding UI state and presentation logic.
- **Domain** (services, use cases, libraries): business rules, calculations, and transaction orchestration.
- **Data** (models, repositories, DAOs, API clients): the only layer that runs queries or calls third-party APIs.

**What is forbidden in presentation:** raw queries, calls to external APIs, and business rules or complex calculations. Reading data is fine when it goes through a data-access function (a server component or data hook calling a repository or service); calling a third-party API directly from a component is not.

**Right-size it.** For simple CRUD, a thin handler plus a repository can be enough. Don't add a service layer of pass-through methods; add one when real business logic appears.

**No silent architecture.** Adding a layer or a major feature gets a one-line entry under Key Decisions in the blueprint, and the user is told.

---

## 3. Lifecycle Scripts

Predictable commands beat guessing raw shell invocations.

**Discover first.** Look in the README, `package.json` scripts, Makefile or justfile, `composer.json`, `pyproject.toml`, and similar. If the project already has a way to run, build, test, lint, or migrate, use it and don't create a parallel `scripts/` directory.

**New projects without any:** create thin wrappers in a root `scripts/` directory around the stack's native tools, with the extension the platform needs (`.sh`, `.bat`, `.ps1`):
- `scripts/dev`: run the development server with the right environment loaded.
- `scripts/build`: produce production artifacts.
- `scripts/test`: run unit and integration tests.
- `scripts/lint`: run the linter and type checker, in check mode.
- `scripts/migrate`: apply database migrations (only if the project has a database).

**Rules**
- Use these scripts instead of improvising commands.
- **Migrations are safe by default:** apply forward migrations only, show pending status first when the tool supports it, and require explicit user confirmation each time for anything destructive (drop, reset, truncate, rollback of applied data). Refuse to run against a production target (host, database name, or environment says production); the user runs that themselves.
- **No orphan processes:** check that the port is free before starting a server, remember the PID of what you start, and stop it before finishing unless the user wants it left running.
- **Respect shared files:** `lint --fix` and `format` are whole-file formatters. While a file is `[SHARED]` under `nodrift-sync`, run linters in check mode only.

---

## 4. Documentation & Living Roadmap

- **Roadmap and tracks:** when a feature milestone is finished, follow `nodrift-sync` Section 6, which owns the completion lifecycle and statuses. If you discover scope that isn't on the roadmap, report it to the user and add it as `[ ]` only with their agreement.
- **README:** if a change affects runtime behavior (a new env variable, endpoint, run command, or setup step), update the relevant README section in the same change.
- **Blueprint conventions:** when you introduce or settle a convention (layer mapping, naming), record it in the blueprint's `Conventions` field.

---

## 5. Defensive Error Handling & Guardrails

- **No swallowed errors.** No empty `catch {}` blocks and no ignored error returns (`err != nil`). Log internal errors with context on the server; return sanitized messages to clients, with no stack traces, SQL, or internal paths.
- **Validate at the boundary.** Check and normalize all external input in handlers. Use parameterized queries only, and encode output to prevent XSS.
- **Authentication and authorization on the server.** Protected routes check who the caller is and whether they may touch that resource (ownership or role). Hiding a button in the UI is not access control.
- **Complexity is a signal, not a trigger.** A file past roughly 300 lines, or a function doing several jobs, is a reason to consider extraction. Apply it to the code you are writing or changing; propose, but don't perform, refactors of unrelated existing code unless asked.
- **Dependencies:** add one only when it earns its place. Check that it is maintained and its license fits, and don't import a package for a trivial function. Lockfile edits follow `nodrift-sync` Section 5.4.
- **Production build hardening:** turn off debug and development flags, decide deliberately about source maps and debug endpoints, and keep `.env`, `.git`, dev dependencies, and tests out of distribution bundles (`.dockerignore`, package `files` list, or the stack's equivalent).

---

## 6. Tests

- New business logic ships with tests at the lowest level that proves the behavior: unit tests for domain rules, integration tests for data access and endpoints.
- A bug fix gets a regression test when feasible.
- Use the project's existing test framework. If none exists, tell the user and add the stack's standard minimal runner only with their agreement.

---

## 7. Pre-Completion Self-Review (Evidence, Not Impression)

Before saying a task is done, collect evidence. A silent mental audit is easy to skip, so run the checks:

1. **Run the project's checks** through the lifecycle scripts: tests, lint, and type check or build. Use check mode for linters on `[SHARED]` files.
2. **Read your diff:** `git diff -- <your files>`, and open any new untracked files. Other agents' changes may share the working tree, so limit the diff to your own files.
3. **Grep for leftovers** in the changed files: `console.log`, `print(`, `debugger`, `TODO|FIXME|XXX`, commented-out code, unused imports.
4. **Walk the four pillars:**
   - *Security:* injection, unvalidated input, hardcoded secrets, XSS, authentication and authorization on new routes, risk from new dependencies.
   - *Errors & edge cases:* failure paths handled and logged; empty, null, and oversized inputs.
   - *Clean code:* no dead code or debug output, clear naming, manageable complexity.
   - *Consistency:* matches the blueprint's Conventions and the surrounding code; docs and `.env.example` updated.
5. **Report to the user in a few lines:** what you ran, what passed, what failed or could not be checked (for example "no test suite exists"), and anything deferred.

**Scale it.** For a trivial change (typo, copy, config value), do steps 2-3 quickly and skip the rest. For a large change, do everything. Never claim a check you did not run.
