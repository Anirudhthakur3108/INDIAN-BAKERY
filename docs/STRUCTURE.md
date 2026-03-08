# Project Structure Overview

## Directory Layout

```
INDIAN BAKERY/
│
├── frontend/                           # All frontend files
│   ├── html/                           # HTML pages (rendered from backend at /)
│   │   ├── index.html                  # Home page with hero section
│   │   ├── menu.html                   # Menu list + order builder
│   │   ├── contact.html                # Contact & bakery info
│   │   ├── order.html                  # Order checkout form
│   │   └── admin.html                  # Admin login + dashboard
│   │
│   ├── css/
│   │   └── styles.css                  # Global styles (colors, layout, responsive)
│   │                                   # Supports: hero, cards, forms, admin UI
│   │
│   └── js/
│       ├── script.js                   # Core app logic
│       │                               # - Menu loading from API
│       │                               # - Order form handling
│       │                               # - Cart management
│       │                               # - Price calculations
│       │
│       ├── admin.js                    # Admin panel logic
│       │                               # - Login/logout
│       │                               # - Menu CRUD operations
│       │                               # - Order status updates
│       │
│       └── template-config.js          # Bakery branding config
│                                       # - Bakery name, city, contact info
│                                       # - Menu items (offline fallback)
│                                       # - Feature toggles
│
├── backend/                            # Python Flask API server
│   ├── app.py                          # Main Flask application
│   │                                   # - Database initialization (SQLite)
│   │                                   # - API routes (10+ endpoints)
│   │                                   # - Authentication middleware
│   │                                   # - Order processing
│   │
│   ├── requirements.txt                # Python dependencies
│   │                                   # - Flask==3.0.3
│   │                                   # - Werkzeug==3.0.3
│   │
│   ├── README.md                       # Backend setup guide
│   │
│   └── bakery.db                       # SQLite database
│                                       # (Auto-created on first run)
│
└── README.md                           # This project's main documentation
```

---

## File Responsibilities

### HTML Files

| File | Purpose | Key Elements |
|------|---------|---|
| `index.html` | Landing page | Hero section, featured items, CTA buttons |
| `menu.html` | Menu display | Menu sections, add-to-cart, builder sidebar |
| `contact.html` | Contact info | Address, phone, email, map placeholder |
| `order.html` | Checkout | Form for customer details, items, delivery |
| `admin.html` | Admin interface | Login form, menu CRUD, order list |

### JavaScript Modules

| File | Responsibility |
|------|---|
| `template-config.js` | Define bakery branding, contact info, offline menu |
| `script.js` | Frontend app logic (forms, API calls, menu) |
| `admin.js` | Admin dashboard logic (auth, CRUD) |

### Python Backend

| Component | Functionality |
|-----------|---|
| `app.py` | Flask server with all business logic |
| `database` | 4 tables (admins, menu_items, orders, order_items) |

---

## Data Flow

### Customer Order Flow
```
User → Menu Browser (script.js fetches /api/menu)
     → Select Items (store in localStorage)
     → Order Form (validates + submits to POST /api/orders)
     → Database (saved with price snapshot)
     → Success Message
```

### Admin Flow
```
Admin → Login (POST /api/auth/login)
     → Dashboard (GET /api/auth/me checks session)
     → Menu CRUD (GET/POST/PATCH/DELETE /api/admin/menu/*)
     → Order Mgmt (GET /api/admin/orders, PATCH status)
     → Logout (POST /api/auth/logout)
```

---

## Frontend-Backend Communication

### API Endpoints Used

**From `script.js`:**
- `GET /api/menu` → Fetch available items for display
- `POST /api/orders` → Submit customer order

**From `admin.js`:**
- `POST /api/auth/login` → Authenticate admin
- `GET /api/auth/me` → Check if logged in
- `GET /api/admin/menu` → Load menu for editing
- `POST /api/admin/menu` → Add new item
- `PATCH /api/admin/menu/<id>` → Edit item
- `DELETE /api/admin/menu/<id>` → Remove item
- `GET /api/admin/orders` → List all orders
- `PATCH /api/admin/orders/<id>/status` → Update order status

---

## Customization Points

### Easy to Change
- **Bakery Name/Branding**: Edit `template-config.js`
- **Colors/Fonts**: Edit `styles.css` (CSS variables at top)
- **Menu Items**: Add via admin dashboard OR edit `template-config.js`
- **Admin Credentials**: Change in `app.py` seeding logic

### Requires Backend Restart
- Admin username/password changes
- `BAKERY_SECRET_KEY` environment variable
- Database schema modifications

---

## File Sizes & Performance

- **HTML files**: ~8-10 KB each (minimal)
- **CSS**: ~18 KB (single file, highly optimized)
- **JS files**: ~15 KB + 5 KB (minifiable)
- **Backend**: ~15 KB (single file, easy to review)
- **Database**: Grows with orders (initially empty)

**Total Initial Size**: ~80 KB

---

## How Files Connect

```
index.html
├── Imports: ../css/styles.css
├── Imports: ../js/template-config.js
└── Imports: ../js/script.js
    └── Fetches from: /api/menu (app.py)

admin.html
├── Imports: ../css/styles.css
├── Imports: ../js/template-config.js
├── Imports: ../js/script.js
└── Imports: ../js/admin.js
    └── Fetches from: /api/auth/*, /api/admin/* (app.py)

app.py
├── Serves: All HTML + CSS + JS files from FRONTEND_DIR
├── Provides: 10+ JSON API endpoints
├── Manages: SQLite database
└── Authenticates: Admin sessions
```

---

## Setup Checklist

- [ ] Backend installed: `pip install -r backend/requirements.txt`
- [ ] Backend running: `python backend/app.py`
- [ ] Frontend accessible: `http://127.0.0.1:5000/index.html`
- [ ] Admin login works: `http://127.0.0.1:5000/admin.html`
- [ ] Default credentials in code: `admin` / `admin123`
- [ ] Database auto-created: `backend/bakery.db`

---

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Send order confirmation emails
2. **Payment Gateway**: Integrate Razorpay/Stripe
3. **Customer Portal**: Allow customers to track order status
4. **Analytics**: Dashboard showing sales trends
5. **Inventory**: Track stock levels of items
6. **Mobile App**: React Native wrapper around website
