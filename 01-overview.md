# 01 — Product Overview

## The problem

A small company (3–4 people) needs a shared place to hand out work, track who's doing what, and write down task details. They tried Notion, but the cost and limits made it impractical to keep using. They don't need most of Notion — they need a focused, free tool they own outright, so no vendor can change the terms out from under them.

## The goal

Build the smallest pleasant tool that covers the real workflow: projects → tasks → people → statuses, with a Markdown writing surface for details. Minimal, fast, and free to run.

## Who uses it

- **The manager** (e.g. the boss) creates projects, creates tasks, assigns people, and tracks progress.
- **Team members** log in, see what's assigned to them, update statuses, and write task notes.

For a team this size the trust model is light: projects are grouped into **teams** (you see a project if you're on its team, or if it has no team), and an **admin** role manages teams and people. There are no fine-grained per-field permissions beyond that.

## Guiding principles

- **Minimal and calm.** Notion-like, but stripped to essentials. Precision in spacing and type over decoration.
- **Markdown underneath.** All rich text is stored as Markdown so content stays portable and easy to edit or migrate.
- **You own it.** Your code, your database, your data. If any free service ever changes, you can move without losing anything.
- **Free to run.** Every component sits on a free tier. No email service, no paid hosting.
- **Boring where it counts.** No real-time multiplayer, no elaborate permission matrices — just lightweight teams and an admin role. Simple, reliable building blocks.

## In scope for v1

- Email + password accounts; every team member logs in.
- Projects with emoji + name, listed in a collapsible sidebar; create / rename / reorder / delete.
- A Markdown canvas per project for notes.
- People management: name, email, role, emoji.
- Tasks within a project: title, status, assignees (one or more), due date, priority, and a per-task Markdown document.
- Task views: a **table** (the default), a Kanban **board**, and a **calendar** — plus a Markdown **notes** view for the project canvas.
- Deployed to a free host, reachable by URL.

## Out of scope for v1 (note as future ideas, don't build)

- Email or push notifications.
- Real-time co-editing / live cursors.
- Comments, mentions, file attachments.
- Multiple workspaces, nested pages, databases-of-databases.
- Timeline / Gantt views. (A simple month **calendar** view of task due dates *did* ship.)
- Granular roles and permissions.
- Mobile native apps (the web app should simply be usable on a phone).

## What success looks like

The boss opens the app, creates a project with an emoji, adds a few tasks, assigns them to teammates, and drags a card from "Not Started" to "In Progress." A teammate logs in from their own laptop, opens their task, and reads the Markdown brief. Nobody paid anything, and the data lives in a database the company controls.
