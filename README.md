# Compile

**Compile** is a local-first, cloud-synced personal workspace built for students and individual users — designed to be reliable, private, and cost-efficient from day one.

It combines flexible note-taking, structured databases, and workspace organization into a single system, with a long-term vision of becoming a **one-stop personal productivity suite**.

URL: https://compile-web1729.web.app/
---

## Why Compile?

Most productivity tools are either:
- Too simple to scale with real usage, or
- Overbuilt and expensive for individual users

Compile was built to explore a different approach:
- **Local-first UX** with background cloud sync
- **Strong data isolation** using workspace boundaries
- **Real system constraints** (Firebase Spark limits, offline usage, cost awareness)
- Designed for **actual daily use**, not demos

This project is actively used and tested by a small group of college students.

---

## Core Concepts

### 🧠 Local-First, Cloud-Synced
- Pages load instantly from local cache
- Changes sync to the cloud in the background
- Minimal reads/writes to stay within free infrastructure limits

### 🗂 Workspaces (Private & Public)
- Users can create and switch between multiple workspaces
- **Private workspace** → single owner
- **Public workspace** → owner + invited members (via invite link)
- Strong isolation: no cross-workspace data leaks

### 📄 Pages & Databases
- Pages support block-based editing (text, headings, code blocks, etc.)
- Databases are structured pages (table view) where:
  - Each row is also a page
  - Rows can be opened, linked, and extended
- Designed to scale without per-block Firestore reads

### 🔐 Security-First Architecture
- No global data collections
- All data scoped under workspaces
- Membership-based access control enforced at the database level

---

## Tech Stack

- **Frontend:** React + Vite
- **Editor:** Custom block editor with CodeMirror for code blocks
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **State Strategy:** Local cache → debounced cloud persistence
- **Hosting:** Firebase Hosting (Spark plan)

---

## Architecture Highlights

- Workspace-scoped Firestore collections
- Page-level document storage (not per block)
- Sidebar built from a cached page index (1 read per workspace)
- Debounced persistence to minimize write usage
- Designed to safely support ~1,000 users on free infrastructure

---

## Current Features

- Block-based editor with heading collapse
- Code blocks with syntax highlighting & indentation
- Page hierarchy & sidebar navigation
- Private & public workspaces
- Google authentication
- Offline-friendly usage
- Export-friendly data model

---

## Planned Improvements

Compile is actively evolving. Upcoming areas include:
- Expense & finance tracking (workspace-scoped)
- Automation & smart rules
- Better dashboards & insights
- Collaboration improvements
- Mobile support

The focus will remain on **incremental, stable improvements**, not feature bloat.

---

## Status

This is an **active personal project**, not a polished SaaS.
Expect:
- Rapid iteration
- Architectural refinements
- Breaking changes as the system evolves

Feedback and discussion are welcome.

---

## Motivation

This project exists as much to **learn real system design tradeoffs** as to build a useful product:
- Cost-aware backend decisions
- Multi-tenant data isolation
- UX vs infrastructure constraints
- Designing for real users, not assignments

---

## License

MIT (or your preferred license)
