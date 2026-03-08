# 🍞 INDIAN BAKERY - Complete Project

A full-stack Indian bakery website with admin dashboard, menu management, and order system. Built with HTML/CSS/JavaScript frontend and Python Flask backend.

## Quick Start

### 1. Start Backend Server

```powershell
cd .\backend
python.exe -m pip install -r requirements.txt  # First time only
python.exe app.py
```

Backend runs on: `http://127.0.0.1:5000`

### 2. Open Website

- **Home/Menu/Order**: `http://127.0.0.1:5000/index.html`
- **Admin Dashboard**: `http://127.0.0.1:5000/admin.html`

### 3. Admin Login

- Username: `admin`
- Password: `admin123`

> ⚠️ Change these credentials in `backend/app.py` for production!

---

## 📁 Project Structure

```
INDIAN BAKERY/
├── frontend/
│   ├── html/              # Website pages
│   │   ├── index.html     # Home page
│   │   ├── menu.html      # Menu & order builder
│   │   ├── contact.html   # Contact information
│   │   ├── order.html     # Order checkout form
│   │   └── admin.html     # Admin login & dashboard
│   ├── css/
│   │   └── styles.css     # All styling (responsive, dark mode, themes)
│   └── js/
│       ├── script.js              # Main app logic (menu, orders, forms)
│       ├── admin.js               # Admin dashboard + CRUD operations
│       └── template-config.js     # Bakery branding & offline fallback
├── backend/
│   ├── app.py             # Flask API + database schema
│   ├── requirements.txt    # Python dependencies (Flask, Werkzeug)
│   ├── README.md          # Backend setup instructions
│   └── bakery.db          # SQLite database (auto-created)
└── README.md              # This file
```

---

## ✨ Features

### Public Features
- 🎨 Beautiful responsive design with Indian bakery theme
- 📱 Mobile-friendly menu browsing
- 🛒 Order builder with live cart
- 🧮 Auto-calculating totals
- 📦 Pickup/Delivery options with address field
- 🔄 Fallback to config-based menu if backend unavailable

### Admin Features
- 🔐 Secure admin login (session-based)
- ➕ Add new bakery items with category, price, description
- ✏️ Edit existing items (availability, pricing)
- 🗑️ Delete menu items
- 📋 View all orders with customer details
- 🔄 Update order status (new → confirmed → preparing → delivered)

### Backend
- ✅ RESTful JSON APIs
- 🗄️ SQLite database with schema auto-initialization
- 🔒 Password hashing (Werkzeug)
- 📸 Price snapshots (prevents price tampering)
- 🌍 CORS-friendly (ready for external apps)

---

## 🔌 API Endpoints

### Public APIs
- `GET /api/menu` - Get available menu items grouped by category
- `POST /api/orders` - Submit customer order

### Admin APIs (Requires Login)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Check authentication status
- `GET /api/admin/menu` - List all menu items
- `POST /api/admin/menu` - Add new menu item
- `PATCH /api/admin/menu/<id>` - Update menu item
- `DELETE /api/admin/menu/<id>` - Delete menu item
- `GET /api/admin/orders` - List all orders
- `PATCH /api/admin/orders/<id>/status` - Update order status

---

## 🎨 Customization

### Change Bakery Branding
Edit `frontend/js/template-config.js`:

```javascript
window.BAKERY_TEMPLATE = {
  brandName: "Your Bakery Name",
  brandInitials: "YB",
  city: "Your City",
  heroTagline: "Your tagline here",
  contact: {
    address: "Your address",
    phone: "+91 XXXXX XXXXX",
    email: "your@email.com",
    hours: "Your opening hours",
    mapLandmark: "Nearby landmark"
  },
  // ... more config
};
```

### Change Admin Credentials
Edit `backend/app.py` and update `ensure_tables()` function:

```python
cur.execute(
    "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)",
    ("newusername", generate_password_hash("newpassword"), utc_now()),
)
```

---

## 💻 Technology Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript (ES5 compatible)
- LocalStorage for client-side state
- Fetch API for backend communication
- Responsive grid layout

**Backend:**
- Python 3.11.4
- Flask 3.0.3 (lightweight HTTP server)
- Werkzeug 3.0.3 (password hashing)
- SQLite (zero-configuration database)

---

## 🔒 Security Notes

1. **Change default admin credentials** before deploying
2. **Set `BAKERY_SECRET_KEY` environment variable:**
   ```powershell
   $env:BAKERY_SECRET_KEY = "your-super-secret-key-min-32-chars"
   ```
3. **Use HTTPS** in production
4. **Add rate limiting** for order API
5. **Validate email/phone** before storing orders

---

## 📋 Database Schema

### Admin Accounts
```
admins (id, username, password_hash, created_at)
```

### Menu Items
```
menu_items (id, name, description, price, category, is_available, created_at, updated_at)
```

### Orders
```
orders (id, customer_name, phone, order_type, pickup_date, slot, delivery_address, notes, status, created_at)
order_items (id, order_id, menu_item_id, item_name_snapshot, price_snapshot, qty)
```

---

## 🚀 Deployment

### Local Development
```powershell
cd backend
python.exe app.py
```

### Production with Gunicorn
```powershell
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
```

### Docker (Optional)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["flask", "run", "--host=0.0.0.0"]
```

---

## 📝 License

This project is ready for client use. All rights reserved.

---

## 🤝 Support

For issues or customization requests:
1. Check backend logs in terminal
2. Verify admin credentials in `backend/app.py`
3. Export `BAKERY_SECRET_KEY` environment variable
4. Restart Flask server after changes
