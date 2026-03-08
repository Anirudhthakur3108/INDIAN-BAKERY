from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, redirect, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent
DB_PATH = BASE_DIR / "bakery.db"

PUBLIC_FILES = {
    "index.html",
    "menu.html",
    "contact.html",
    "order.html",
    "admin.html",
    "styles.css",
    "script.js",
    "admin.js",
    "template-config.js",
}


app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("BAKERY_SECRET_KEY", "change-this-in-production")


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def utc_now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin_id"):
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs)

    return wrapper


def ensure_tables() -> None:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            is_available INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            order_type TEXT NOT NULL,
            pickup_date TEXT NOT NULL,
            slot TEXT NOT NULL,
            delivery_address TEXT,
            notes TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER,
            item_name_snapshot TEXT NOT NULL,
            price_snapshot REAL NOT NULL,
            qty INTEGER NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id)
        )
        """
    )

    cur.execute("SELECT COUNT(*) AS count FROM admins")
    admin_count = cur.fetchone()["count"]
    if admin_count == 0:
        cur.execute(
            "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)",
            ("admin", generate_password_hash("admin123"), utc_now()),
        )

    cur.execute("SELECT COUNT(*) AS count FROM menu_items")
    menu_count = cur.fetchone()["count"]
    if menu_count == 0:
        default_items = [
            ("Sourdough Pav", "Natural fermentation with soft crumb for sliders and maska pairings.", 120, "Signature Breads"),
            ("Jeera Focaccia", "Olive oil focaccia with roasted jeera and rock salt top.", 210, "Signature Breads"),
            ("Multigrain Kulcha Loaf", "Healthy loaf with sesame, flax, and light methi hint.", 190, "Signature Breads"),
            ("Rose Rasmalai Tres Leches", "Soft sponge with saffron milk soak and rose cream.", 260, "Cakes & Pastries"),
            ("Dark Chocolate Orange Gateau", "Rich ganache with candied orange and sea salt.", 290, "Cakes & Pastries"),
            ("Filter Coffee Opera Slice", "South Indian coffee syrup layered with almond sponge.", 240, "Cakes & Pastries"),
            ("Motichoor Cheesecake Jar", "Baked cheesecake topped with tiny boondi crunch.", 200, "Indian Sweet Fusion"),
            ("Gulkand Danish", "Flaky pastry filled with rose-petal preserve and nuts.", 170, "Indian Sweet Fusion"),
            ("Kesar Peda Tart", "Buttery tart shell with saffron peda cream.", 190, "Indian Sweet Fusion"),
        ]
        now = utc_now()
        cur.executemany(
            """
            INSERT INTO menu_items (name, description, price, category, is_available, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)
            """,
            [(name, desc, price, category, now, now) for name, desc, price, category in default_items],
        )

    conn.commit()
    conn.close()


def parse_json() -> dict[str, Any]:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_phone(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())


def group_menu_sections(items: list[sqlite3.Row]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in items:
        grouped.setdefault(row["category"], []).append(
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "price": float(row["price"]),
                "isAvailable": bool(row["is_available"]),
            }
        )
    return [{"title": category, "items": items_list} for category, items_list in grouped.items()]


@app.get("/")
def root_redirect():
    return redirect("/index.html")


@app.get("/<path:filename>")
def serve_frontend_file(filename: str):
    if filename not in PUBLIC_FILES:
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(FRONTEND_DIR, filename)


@app.post("/api/auth/login")
def login():
    data = parse_json()
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_db()
    row = conn.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
    conn.close()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["admin_id"] = row["id"]
    session["admin_username"] = row["username"]
    return jsonify({"message": "Login successful", "username": row["username"]})


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.get("/api/auth/me")
def me():
    if not session.get("admin_id"):
        return jsonify({"authenticated": False})
    return jsonify(
        {
            "authenticated": True,
            "admin": {"id": session.get("admin_id"), "username": session.get("admin_username")},
        }
    )


@app.get("/api/menu")
def list_menu_public():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, id"
    ).fetchall()
    conn.close()
    return jsonify({"sections": group_menu_sections(rows)})


@app.get("/api/admin/menu")
@admin_required
def list_menu_admin():
    conn = get_db()
    rows = conn.execute("SELECT * FROM menu_items ORDER BY category, id").fetchall()
    conn.close()
    return jsonify(
        {
            "items": [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "description": row["description"],
                    "price": float(row["price"]),
                    "category": row["category"],
                    "isAvailable": bool(row["is_available"]),
                }
                for row in rows
            ]
        }
    )


@app.post("/api/admin/menu")
@admin_required
def create_menu_item():
    data = parse_json()
    name = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()
    category = str(data.get("category", "")).strip()
    price_raw = data.get("price")
    is_available = bool(data.get("isAvailable", True))

    if not name or not description or not category:
        return jsonify({"error": "name, description, and category are required"}), 400

    try:
        price = float(price_raw)
        if price < 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "price must be a non-negative number"}), 400

    now = utc_now()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO menu_items (name, description, price, category, is_available, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (name, description, price, category, 1 if is_available else 0, now, now),
    )
    conn.commit()
    item_id = cur.lastrowid
    conn.close()

    return jsonify({"message": "Menu item created", "id": item_id}), 201


@app.patch("/api/admin/menu/<int:item_id>")
@admin_required
def update_menu_item(item_id: int):
    data = parse_json()

    updates = []
    values: list[Any] = []

    if "name" in data:
        name = str(data.get("name", "")).strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        updates.append("name = ?")
        values.append(name)

    if "description" in data:
        description = str(data.get("description", "")).strip()
        if not description:
            return jsonify({"error": "description cannot be empty"}), 400
        updates.append("description = ?")
        values.append(description)

    if "category" in data:
        category = str(data.get("category", "")).strip()
        if not category:
            return jsonify({"error": "category cannot be empty"}), 400
        updates.append("category = ?")
        values.append(category)

    if "price" in data:
        try:
            price = float(data.get("price"))
            if price < 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"error": "price must be a non-negative number"}), 400
        updates.append("price = ?")
        values.append(price)

    if "isAvailable" in data:
        updates.append("is_available = ?")
        values.append(1 if bool(data.get("isAvailable")) else 0)

    if not updates:
        return jsonify({"error": "No valid fields provided"}), 400

    updates.append("updated_at = ?")
    values.append(utc_now())
    values.append(item_id)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(f"UPDATE menu_items SET {', '.join(updates)} WHERE id = ?", tuple(values))
    conn.commit()
    changed = cur.rowcount
    conn.close()

    if changed == 0:
        return jsonify({"error": "Menu item not found"}), 404

    return jsonify({"message": "Menu item updated"})


@app.delete("/api/admin/menu/<int:item_id>")
@admin_required
def delete_menu_item(item_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM menu_items WHERE id = ?", (item_id,))
    conn.commit()
    changed = cur.rowcount
    conn.close()

    if changed == 0:
        return jsonify({"error": "Menu item not found"}), 404

    return jsonify({"message": "Menu item deleted"})


@app.post("/api/orders")
def create_order():
    data = parse_json()

    customer_name = str(data.get("customerName", "")).strip()
    phone = normalize_phone(str(data.get("phone", "")))
    order_type = str(data.get("orderType", "")).strip().lower()
    pickup_date = str(data.get("pickupDate", "")).strip()
    slot = str(data.get("slot", "")).strip()
    delivery_address = str(data.get("deliveryAddress", "")).strip()
    notes = str(data.get("notes", "")).strip()
    items = data.get("items")

    if not customer_name or len(customer_name) < 2:
        return jsonify({"error": "Customer name is required"}), 400
    if len(phone) != 10:
        return jsonify({"error": "Phone must be 10 digits"}), 400
    if order_type not in {"pickup", "delivery"}:
        return jsonify({"error": "orderType must be pickup or delivery"}), 400
    if not pickup_date:
        return jsonify({"error": "pickupDate is required"}), 400
    if not slot:
        return jsonify({"error": "slot is required"}), 400
    if order_type == "delivery" and len(delivery_address) < 8:
        return jsonify({"error": "deliveryAddress is required for delivery"}), 400

    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"error": "At least one order item is required"}), 400

    clean_items: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            return jsonify({"error": "Invalid order item format"}), 400

        name = str(item.get("name", "")).strip()
        qty_raw = item.get("qty")
        try:
            qty = int(qty_raw)
            if qty < 1:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"error": f"Invalid qty for item {name or 'unknown'}"}), 400

        if not name:
            return jsonify({"error": "Order item name is required"}), 400

        clean_items.append({"name": name, "qty": qty})

    conn = get_db()
    cur = conn.cursor()
    created_at = utc_now()
    cur.execute(
        """
        INSERT INTO orders
        (customer_name, phone, order_type, pickup_date, slot, delivery_address, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            customer_name,
            phone,
            order_type,
            pickup_date,
            slot,
            delivery_address if order_type == "delivery" else None,
            notes,
            "new",
            created_at,
        ),
    )
    order_id = cur.lastrowid

    for item in clean_items:
        menu_row = cur.execute(
            "SELECT id, price FROM menu_items WHERE name = ? ORDER BY id DESC LIMIT 1",
            (item["name"],),
        ).fetchone()

        menu_item_id = menu_row["id"] if menu_row else None
        price_snapshot = float(menu_row["price"]) if menu_row else 0.0

        cur.execute(
            """
            INSERT INTO order_items
            (order_id, menu_item_id, item_name_snapshot, price_snapshot, qty)
            VALUES (?, ?, ?, ?, ?)
            """,
            (order_id, menu_item_id, item["name"], price_snapshot, item["qty"]),
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "Order created", "orderId": order_id}), 201


@app.get("/api/admin/orders")
@admin_required
def list_orders_admin():
    conn = get_db()
    order_rows = conn.execute(
        "SELECT * FROM orders ORDER BY created_at DESC"
    ).fetchall()

    orders: list[dict[str, Any]] = []
    for row in order_rows:
        item_rows = conn.execute(
            "SELECT item_name_snapshot, price_snapshot, qty FROM order_items WHERE order_id = ?",
            (row["id"],),
        ).fetchall()
        orders.append(
            {
                "id": row["id"],
                "customerName": row["customer_name"],
                "phone": row["phone"],
                "orderType": row["order_type"],
                "pickupDate": row["pickup_date"],
                "slot": row["slot"],
                "deliveryAddress": row["delivery_address"],
                "notes": row["notes"],
                "status": row["status"],
                "createdAt": row["created_at"],
                "items": [
                    {
                        "name": item["item_name_snapshot"],
                        "price": float(item["price_snapshot"]),
                        "qty": item["qty"],
                    }
                    for item in item_rows
                ],
            }
        )

    conn.close()
    return jsonify({"orders": orders})


@app.patch("/api/admin/orders/<int:order_id>/status")
@admin_required
def update_order_status(order_id: int):
    data = parse_json()
    status = str(data.get("status", "")).strip().lower()
    allowed = {"new", "confirmed", "preparing", "delivered", "cancelled"}

    if status not in allowed:
        return jsonify({"error": f"status must be one of: {', '.join(sorted(allowed))}"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    conn.commit()
    changed = cur.rowcount
    conn.close()

    if changed == 0:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({"message": "Order status updated"})


if __name__ == "__main__":
    ensure_tables()
    app.run(debug=True)
