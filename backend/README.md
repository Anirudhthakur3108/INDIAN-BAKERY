# Bakery Backend (Flask + SQLite)

## What this backend includes

- Public APIs:
  - `GET /api/menu`
  - `POST /api/orders`
- Admin auth APIs:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Admin menu APIs:
  - `GET /api/admin/menu`
  - `POST /api/admin/menu`
  - `PATCH /api/admin/menu/<id>`
  - `DELETE /api/admin/menu/<id>`
- Admin order APIs:
  - `GET /api/admin/orders`
  - `PATCH /api/admin/orders/<id>/status`

## Setup

1. Open terminal in `backend`.
2. Install dependencies:

```powershell
C:/Users/thaku/AppData/Local/Programs/Python/Python311/python.exe -m pip install -r requirements.txt
```

3. Run the backend:

```powershell
C:/Users/thaku/AppData/Local/Programs/Python/Python311/python.exe app.py
```

4. Open site:

- `http://127.0.0.1:5000/index.html`
- `http://127.0.0.1:5000/admin.html`

## Admin default credentials

- Username: `admin`
- Password: `admin123`

Change this in production by updating seeded admin logic in `app.py` and setting a strong `BAKERY_SECRET_KEY` environment variable.
