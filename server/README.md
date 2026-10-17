# FastAPI + Supabase PostgreSQL

## Install

- Python 3.10 or newer
- Supabase CLI (already installed and logged in for this workspace)
- A Supabase project and its PostgreSQL connection string

Create a virtual environment and install the Python dependencies:

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## Configure the database connection

In the Supabase dashboard, click **Connect** and copy the **Direct connection** URI for a long-running backend when its host supports IPv6. On IPv4-only hosting, copy the **Session pooler** URI instead. Use the database password, not the Supabase account password. Copy `.env.example` to `.env`, replace its sample URL with the dashboard URI, change the URI scheme to `postgresql+psycopg://`, and keep `sslmode=require`. Supabase's shared pooler host and username must be copied exactly from the dashboard; don't guess them. Keep `.env` out of source control. See [Supabase's connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Apply the schema

From this directory, link the local Supabase project and push the migration:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates `public.users` with `user_id` as an integer identity primary key, unique `user_username`, `user_password` for a password hash, and `account_created` as a timezone-aware timestamp defaulting to the current time. Row Level Security is enabled, with no client policies; keep database access on the backend and never expose the service role key to a browser or mobile app.

## Run the API

```sh
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the API docs. `GET /health/db` checks that the API can connect to PostgreSQL. The connection is created from `DATABASE_URL` in `.env`.

## Directory layout

```text
server/
├── app/
│   ├── config.py       # environment-based settings
│   ├── database.py     # SQLAlchemy engine and session dependency
│   ├── main.py         # FastAPI app and health checks
│   └── models.py       # SQLAlchemy table model
├── supabase/
│   └── migrations/    # versioned SQL migrations
├── .env               # local secrets (ignored by Git)
├── .env.example       # safe configuration template
└── requirements.txt
```

This scaffold deliberately does not implement public registration/login yet. When adding it, hash passwords with a current password-hashing library before saving them; never store or return plaintext passwords.
