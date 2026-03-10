# ✅ Indian Bakery Project - Complete Setup Guide

## What You Have

A complete, production-ready bakery website with:
- ✨ Beautiful responsive frontend (HTML/CSS/JavaScript)
- 🔐 Admin dashboard with login & authentication
- 📊 Full order management system
- 🗄️ PostgreSQL database with auto-initialization
- 🚀 Flask REST API backend

---

## How to Start

### 1️⃣ Open Terminal in Backend Folder

```powershell
cd "c:\Users\thaku\Dropbox\PC\Desktop\INDIAN BAKERY\backend"
```

### 2️⃣ Install Dependencies (First Time Only)

```powershell
python.exe -m pip install -r requirements.txt
```

### 3️⃣ Run the Backend Server

Set environment variables first:

```powershell
$env:DATABASE_URL = "postgresql://<user>:<password>@<host>:5432/<database>"
$env:BAKERY_SECRET_KEY = "very-long-secret-key-at-least-32-characters"
```

```powershell
python.exe app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

### 4️⃣ Open in Browser

Click any of these links:

**Customer Pages:**
- Home: http://127.0.0.1:5000/index.html
- Menu: http://127.0.0.1:5000/menu.html
- Contact: http://127.0.0.1:5000/contact.html
- Order: http://127.0.0.1:5000/order.html

**Admin Dashboard:**
- Admin: http://127.0.0.1:5000/admin.html

---

## Admin Login

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

### What You Can Do as Admin

✅ **Manage Menu**
- Add new bakery items (name, price, category, description)
- Edit existing items (change price, mark unavailable, update description)
- Delete items you don't offer anymore

✅ **Manage Orders**
- View all customer orders with details
- Update order status: `new` → `confirmed` → `preparing` → `delivered`
- See customer names, addresses, phone numbers, special requests

---

## Project Organization

### Clean Folder Structure

```
📁 INDIAN BAKERY/
├── 📁 frontend/
│   ├── 📁 html/  (5 HTML pages)
│   ├── 📁 css/   (1 CSS file)
│   └── 📁 js/    (3 JavaScript files)
├── 📁 backend/   (Flask Python server)
├── 📁 docs/      (Documentation)
└── 📄 README.md  (Main project guide)
```

### What Each Part Does

| Folder | What It Contains | Purpose |
|--------|---|---|
| **frontend/html/** | index, menu, contact, order, admin.html | Website pages users see |
| **frontend/css/** | styles.css | All colors, fonts, layout styling |
| **frontend/js/** | script.js, admin.js, template-config.js | Website logic & API calls |
| **backend/** | app.py, requirements.txt | Flask server + database |
| **docs/** | STRUCTURE.md, QUICK_START.md | Documentation files |

---

## How It Works

### Customer Journey

1. 👤 **User visits** `http://127.0.0.1:5000/index.html`
2. 🍞 **Sees menu** (loaded from database via `/api/menu`)
3. 🛒 **Adds items to cart** (saved in browser's memory)
4. 📝 **Fills order form** with name, phone, pickup/delivery details
5. ✅ **Submits order** (sent to `/api/orders` API)
6. 📊 **Order saved** to database with all details
7. ✨ **Success message** shows Order ID

### Admin Journey

1. 🔐 **Admin logs in** with username/password
2. 📋 **Dashboard shows** menu items & orders list
3. ➕ **Can add items**: name, price, category, description
4. ✏️ **Can edit items**: change price, availability, details
5. 🗑️ **Can delete items**: remove from menu
6. 📦 **Can update orders**: change status from new → delivered
7. 📞 **See customer info**: name, phone, address, special requests

---

## Customization

### Change Bakery Name

Open: `frontend/js/template-config.js` and change:

```javascript
window.BAKERY_TEMPLATE = {
  brandName: "Your Bakery Name",      // ← Change this
  brandInitials: "YB",                // ← And this
  city: "Your City",                  // ← And this
  // ... rest of config
};
```

### Change Admin Password

Open: `backend/app.py` and find this line:

```python
cur.execute(
  "INSERT INTO admins (username, password_hash, created_at) VALUES (%s, %s, %s)",
    ("admin", generate_password_hash("admin123"), utc_now()),  # ← Change "admin123"
)
```

Then restart the server.

### Change Contact Info

In `frontend/js/template-config.js`, update:

```javascript
contact: {
  address: "Your Address",
  phone: "+91 XXXXX XXXXX",
  email: "your@email.com",
  hours: "Your Hours",
  mapLandmark: "Nearby Place"
}
```

---

## Features Summary

### 🎨 Frontend
- ✅ Beautiful responsive design (works on mobile & desktop)
- ✅ Menu browsing with categories
- ✅ Add items to cart with quantity controls
- ✅ Order form with validation
- ✅ Pickup or delivery options (address shows only for delivery)
- ✅ Price calculations (automatic total)
- ✅ Admin login & dashboard

### 🔐 Security
- ✅ Admin password hashing (nobody sees plain passwords)
- ✅ Session-based login (logout clears session)
- ✅ Price snapshots (prevents price manipulation in database)
- ✅ Input validation on all forms

### 💾 Database
- ✅ 4 tables: admins, menu_items, orders, order_items
- ✅ Auto-initialization (created on first run)
- ✅ Price tracking (snapshots of prices at order time)
- ✅ Order status tracking (new → delivered)

### 📱 API
- ✅ 10+ REST endpoints
- ✅ JSON requests/responses
- ✅ Error handling with messages
- ✅ Admin authentication

---

## Troubleshooting

### Backend won't start?
```powershell
# Make sure you're in the backend folder
cd "c:\Users\thaku\Dropbox\PC\Desktop\INDIAN BAKERY\backend"

# Check Python is installed
python.exe --version

# Try installing again
python.exe -m pip install -r requirements.txt

# Then run
python.exe app.py
```

### Admin login not working?
- Check default credentials: `admin` / `admin123`
- Make sure backend is running (you should see `Running on http://127.0.0.1:5000`)
- Clear browser cache (Ctrl+Shift+Delete)
- Try a different browser

### Menu not showing?
- Check backend is running in terminal
- Open browser console (F12) and check for errors
- Try accessing `http://127.0.0.1:5000/api/menu` directly (should see JSON)

### Can't find files?
All files are organized in: `c:\Users\thaku\Dropbox\PC\Desktop\INDIAN BAKERY\`

---

## Files at a Glance

**You need to edit for customization:**
- `frontend/js/template-config.js` - Bakery name, contact info, branding
- `backend/app.py` - Admin credentials, database settings

**You can delete/ignore:**
- `docs/` folder (just documentation)
- Original files in Desktop (they're copied to INDIAN BAKERY folder)

**Auto-created on first run:**
- `admins`, `menu_items`, `orders`, `order_items` tables in PostgreSQL

---

## Next Steps

### Testing Checklist

1. ✅ Backend starts without errors
2. ✅ Can access `http://127.0.0.1:5000/index.html`
3. ✅ Menu items display on home page
4. ✅ Can add items to order on menu page
5. ✅ Can fill and submit order form
6. ✅ Can login as admin with `admin/admin123`
7. ✅ Can see all orders in admin dashboard
8. ✅ Can add new menu item as admin
9. ✅ Can change order status as admin
10. ✅ Can logout successfully

### For Production

1. 🔐 **Change admin credentials** in `backend/app.py`
2. 🔑 **Set environment variable:**
   ```powershell
  $env:DATABASE_URL = "postgresql://<user>:<password>@<host>:5432/<database>"
   $env:BAKERY_SECRET_KEY = "very-long-secret-key-at-least-32-characters"
   ```
3. 🚀 **Deploy to a real server** (Heroku, AWS, etc.)
4. 📧 **Add email notifications** (optional enhancement)
5. 💳 **Add payment gateway** (Razorpay, Stripe)

---

## Support Resources

- **Main README**: Read `INDIAN BAKERY/README.md` for full details
- **Structure**: Read `INDIAN BAKERY/docs/STRUCTURE.md` to understand files
- **Backend Guide**: Read `INDIAN BAKERY/backend/README.md` for backend details

---

## 🎉 You're All Set!

Everything is ready to use. Start with step **1️⃣** above to launch the backend server.

Enjoy your bakery website! 🍞✨
