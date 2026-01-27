# Dealer Portal MVP

CSV-driven B2B parts ordering portal (Phase I MVP) built with Next.js 14, Prisma, and Postgres 16.

## Quick start (Docker)

1) Copy env file:

```bash
cp .env.example .env
```

2) Set these values in `.env`:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

3) Start the stack:

```bash
docker compose up --build
```

The web container will wait for Postgres, run migrations + seed, and start Next.js.

## Required local commands

```bash
# migrate
npm run migrate

# seed
npm run seed

# demo seed (optional)
npm run seed:demo

# run dev
npm run dev
```

When using Docker, run inside the container:

```bash
docker compose exec web npm run migrate
docker compose exec web npm run seed
docker compose exec web npm run dev
```

## Admin flow

- The first login is the seeded super admin (from env vars).
- Admins create dealer accounts (no self-registration).
- Admin routes are under `/admin/*`.

## Dealer flow

- Dealers log in at `/login`.
- Portal routes are under `/portal/*`.
- Cart persists in the database; checkout creates order snapshots.

## Uploads

All uploads validate headers exactly (trimmed), validate row types, and reject the entire file if any errors are found.
Error CSVs are generated and available to download from the admin UI.

Supported uploads:

1. Parts (Aftermarket)
2. Parts (Genuine)
3. Order Status
4. Supersession

## Samples

Sample CSVs and templates are in `samples/`:

- `samples/parts_aftermarket_sample.csv`
- `samples/parts_genuine_sample.csv`
- `samples/order_status_template.csv`
- `samples/supersession_template.csv`

## Branding assets

Place brand assets under `public/brand/` and update placeholder imagery under `public/assets/` when ready.

## Notes

- All data writes go through server actions or API routes.
- Search uses standard indexes; enable `pg_trgm` if you want advanced ILIKE performance.

## Demo seed (optional)

The demo seed populates realistic sample data for client demos (users, dealers, catalog, orders,
order status updates, upload batches) and is safe to run multiple times.

```bash
npm run seed:demo
```

Resetting demo data:
Running the demo seed again will remove any existing demo records (prefixed with `DEMO-` or
`@demo.local`) and re-seed a fresh dataset.

Demo logins:
- Admins: `admin1@demo.local`, `admin2@demo.local`, `admin3@demo.local`
- Dealers: `dealer1@demo.local` ... `dealer8@demo.local`
- Password: `DemoPass123!`
