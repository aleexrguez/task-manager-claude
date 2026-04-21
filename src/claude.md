# Architecture: Feature-First + Scope Rule

## Core principle

Structure follows **features first**, then **scope rule**.

- GLOBAL → shared across 2+ features
- FEATURE → encapsulated, domain-specific

---

## Project Structure

src/
├── features/                # DOMAIN FEATURES (main entry point)
│   └── task-manager/
│       ├── api/             # API client + DTOs
│       ├── components/      # Presentational components
│       ├── containers/      # Smart components (data + logic)
│       ├── hooks/           # React Query + feature hooks
│       ├── store/           # Zustand (UI-only state)
│       ├── types/           # Domain models (Zod source of truth)
│       ├── utils/           # Pure functions
│       └── index.ts         # Public API (barrel)

├── shared/                  # GLOBAL reusable modules
│   ├── components/          # UI primitives (Button, Modal, etc.)
│   ├── hooks/               # Generic hooks
│   ├── services/            # Cross-feature services
│   └── types/               # Shared types

├── router/                  # Routing layer
├── providers/               # React providers (Query, Theme, etc.)
├── app/                     # App bootstrap

---

## Architectural Rules

- Features must be **self-contained**
- No cross-feature imports (only via shared/)
- Types come from **Zod schemas (single source of truth)**
- API layer is **separated from domain**
- UI state (Zustand) ≠ Server state (React Query)
- Utilities must be **pure functions**

---

## Tech Stack

- React 19 + TypeScript
- React Query v5 (server state)
- Zustand (UI state only)
- Zod v4 (validation + typing)
- Tailwind CSS v4
- Vitest + React Testing Library
- ESLint + Prettier (mandatory)

---

## Coding Conventions

- Components → PascalCase
- Hooks → useX naming
- Types → defined via Zod (`z.infer`)
- Imports:
  - `import type` for types (mandatory)
- No business logic inside presentational components
- Containers orchestrate logic, components render UI

---

## Development Workflow (STRICT)

### 1. Architecture (MANDATORY)
Use architect agent:
- define files
- define responsibilities
- enforce feature boundaries

No coding before this step.

---

### 2. TDD (MANDATORY)
Use `tdd-engineer`:

- write failing tests FIRST
- use Vitest + Testing Library
- focus on behavior, not implementation

RED phase must exist before coding.

---

### 3. Implementation
Use `react-implementer`:

- write MINIMUM code to pass tests
- follow architecture strictly
- no overengineering

GREEN phase only.

---

### 4. Refactor
- improve naming, structure, readability
- keep tests passing

---

### 5. Commit (MANDATORY)

After a feature is completed:

1. Ensure tests pass (GREEN)
2. Run:
   - npx tsc --noEmit
   - npm run lint
   - npm run test
3. Create a clean, atomic commit
4. Push changes to origin


### 6. Security Audit
Use `security-auditor`:

- validate inputs (Zod)
- prevent unsafe patterns
- review API usage

---

### 7. Accessibility Audit
Use `accessibility-auditor`:

- semantic HTML
- keyboard navigation
- ARIA where needed

---

## Git Workflow (MANDATORY)

Version control is part of the development process, not an afterthought.

### Rules

- Every completed feature or meaningful change MUST be committed
- Commits must be **small, atomic, and reversible**
- Do NOT accumulate large uncommitted changes
- Push regularly to origin

---

### Commit Message Standard (Conventional Commits)

Use clear, professional commit messages:

- feat: add task detail page with routing and TDD
- fix: resolve accessibility issues in modal focus handling
- refactor: improve task filtering logic
- test: add integration tests for task mutations
- chore: setup eslint and prettier config

---

## Execution Order

1. architect
2. tdd-engineer
3. react-implementer
4. refactor
5. security-auditor
6. accessibility-auditor

---

## Non-Negotiable Rules

- No implementation without tests
- No feature without architecture
- No skipping lint/format
- No mixing domain and API logic
- No global state for server data
- No "quick hacks" in main branches
- Every feature must be committed before starting a new one

---

## Goal

Build **production-grade, scalable, maintainable frontend systems**  
—not demos, not tutorials, not hacks.

---

## Approach
- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Skip files over 100KB unless explicitly required.
- Suggest running /cost when a session is running long to monitor cache ratio.
- Recommend starting a new session when switching to an unrelated task.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.