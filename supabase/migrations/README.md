# Database migrations

`../schema.sql` is the **from-scratch** source of truth — run it to provision a
brand-new database. This folder holds **incremental** changes applied to databases
that were already provisioned before a given change, so an existing environment can
be brought up to date without a full re-provision.

Files are named `<UTC-timestamp>_<snake_case_name>.sql` and are meant to be applied
in filename order. Each is idempotent where practical (`create or replace`,
`drop ... if exists`, `... if not exists`) so re-running is safe.

## Applying a migration

- **Quickest:** paste the file into the Supabase dashboard → SQL Editor → Run.
- **CLI (optional):** `supabase db push` if you adopt the Supabase CLI later.

## Keeping things consistent

When you add a migration here, also fold the same change into `../schema.sql` so a
fresh setup and an upgraded setup end up identical. `schema.sql` should always
describe the *current* shape of the database.
