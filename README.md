# WorkTrack — Build Spec

> **WorkTrack** is a placeholder name. Rename it to anything you like (your company name, "Tasks", etc.) — there's nothing special about it.

This folder is **not the app**. It is a complete set of planning documents that an AI coding agent (Claude Code) can read and use to build the app from scratch. Drop this whole folder into Claude Code on your computer, point it at `CLAUDE.md`, and let it work through the build plan.

## What we're building

A small, free, self-hosted work-tracking tool for a 3–4 person team. Think "a much simpler Notion": a collapsible sidebar of projects on the left, a writing canvas on the right, tasks you assign to people, statuses (Not Started / In Progress / Done), and a Markdown-based editor for notes and task details.

## The 30-second workflow it supports

1. A person opens a **project** (e.g. *VNDP*, *WordPunk*) from the left sidebar.
2. Inside the project they create **tasks** and assign them to **people**.
3. Each task has a **status**, a **due date**, a **priority**, and its own **Markdown document** for the details.
4. Tasks can be viewed as a **board** (drag between status columns) or as a **table**.

## How to use this folder with Claude Code

1. Install Claude Code and Node.js (see `docs/07-setup-and-deploy.md`).
2. Open a terminal in this folder and run `claude`.
3. Tell it: *"Read CLAUDE.md and the docs folder, then start with Phase 0 of the build plan."*
4. Work through the phases in `docs/06-build-plan.md` one at a time, testing as you go.

## Document index

| File | What it's for |
|------|---------------|
| `CLAUDE.md` | The operating manual for the AI agent: stack, rules, how to proceed. **Start here.** |
| `docs/01-overview.md` | The vision, who it's for, and what's in/out of scope for v1. |
| `docs/02-features.md` | Every feature, written as clear requirements with acceptance criteria. |
| `docs/03-data-model.md` | The database schema (tables, fields, relationships) + ready-to-run SQL. |
| `docs/04-design.md` | The look and feel: layout, colors, type, components, copy. |
| `docs/05-tech-stack.md` | The chosen stack, why, and two alternatives. |
| `docs/06-build-plan.md` | A phased, step-by-step build roadmap. |
| `docs/07-setup-and-deploy.md` | Plain-language setup, accounts, and deployment guide. |

## Key decisions already made (so the agent doesn't have to guess)

- **No email notifications** in v1 (keeps it simple and 100% free — no email service or domain needed).
- **Everyone logs in** with their own email + password (Notion-style accounts).
- **Notion-style WYSIWYG editor** that stores content as Markdown underneath.
- **Both board and table views**, with the **board as the default**.
- **No live multi-person co-editing** in v1 (one person edits at a time; others see changes on refresh).
- **Recommended stack:** React + Vite + Supabase + Cloudflare Pages (all free; see `docs/05-tech-stack.md`).
