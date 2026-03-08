(function () {
  var loginPanel = document.querySelector('[data-admin-login-panel]');
  var dashboard = document.querySelector('[data-admin-dashboard]');
  var loginForm = document.querySelector('[data-admin-login-form]');
  var authStatus = document.querySelector('[data-admin-auth-status]');
  var logoutButton = document.querySelector('[data-admin-logout]');
  var addItemForm = document.querySelector('[data-admin-add-item-form]');
  var menuStatus = document.querySelector('[data-admin-menu-status]');
  var menuList = document.querySelector('[data-admin-menu-list]');
  var ordersList = document.querySelector('[data-admin-orders-list]');
  var refreshMenuBtn = document.querySelector('[data-admin-refresh-menu]');
  var refreshOrdersBtn = document.querySelector('[data-admin-refresh-orders]');

  if (!loginPanel || !dashboard) {
    return;
  }

  function setStatus(node, type, text) {
    if (!node) {
      return;
    }
    node.className = 'form-status ' + type;
    node.textContent = text;
  }

  async function requestJson(url, options) {
    var response = await fetch(url, options || {});
    var data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  function showDashboard(isAuthenticated) {
    loginPanel.hidden = isAuthenticated;
    dashboard.hidden = !isAuthenticated;
  }

  async function loadMenu() {
    if (!menuList) {
      return;
    }
    menuList.innerHTML = '<p class="muted">Loading menu...</p>';

    try {
      var data = await requestJson('/api/admin/menu');
      if (!Array.isArray(data.items) || data.items.length === 0) {
        menuList.innerHTML = '<p class="muted">No menu items found.</p>';
        return;
      }

      var html = data.items
        .map(function (item) {
          return (
            '<div class="admin-item card">' +
            '<div class="admin-item-grid">' +
            '<label>Name<input type="text" data-edit-name="' + item.id + '" value="' + item.name.replace(/"/g, '&quot;') + '" /></label>' +
            '<label>Category<input type="text" data-edit-category="' + item.id + '" value="' + item.category.replace(/"/g, '&quot;') + '" /></label>' +
            '<label>Price<input type="number" min="0" step="1" data-edit-price="' + item.id + '" value="' + item.price + '" /></label>' +
            '<label>Available<select data-edit-available="' + item.id + '"><option value="true" ' + (item.isAvailable ? 'selected' : '') + '>Yes</option><option value="false" ' + (!item.isAvailable ? 'selected' : '') + '>No</option></select></label>' +
            '</div>' +
            '<label>Description<textarea rows="2" data-edit-description="' + item.id + '">' + item.description + '</textarea></label>' +
            '<div class="button-row">' +
            '<button class="btn btn-secondary" type="button" data-update-item="' + item.id + '">Update</button>' +
            '<button class="btn btn-secondary" type="button" data-delete-item="' + item.id + '">Delete</button>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      menuList.innerHTML = html;
    } catch (error) {
      menuList.innerHTML = '<p class="form-status error">' + error.message + '</p>';
    }
  }

  function orderItemLine(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return 'No items';
    }
    return items
      .map(function (item) {
        return item.name + ' x ' + item.qty;
      })
      .join(', ');
  }

  async function loadOrders() {
    if (!ordersList) {
      return;
    }
    ordersList.innerHTML = '<p class="muted">Loading orders...</p>';

    try {
      var data = await requestJson('/api/admin/orders');
      if (!Array.isArray(data.orders) || data.orders.length === 0) {
        ordersList.innerHTML = '<p class="muted">No orders yet.</p>';
        return;
      }

      var html = data.orders
        .map(function (order) {
          var address = order.orderType === 'delivery' ? order.deliveryAddress || 'N/A' : 'Pickup';
          return (
            '<div class="admin-item card">' +
            '<p><strong>Order #' + order.id + '</strong> | ' + order.customerName + ' | ' + order.phone + '</p>' +
            '<p class="muted">' + order.orderType + ' | ' + order.pickupDate + ' | ' + order.slot + '</p>' +
            '<p class="muted">Address: ' + address + '</p>' +
            '<p class="muted">Items: ' + orderItemLine(order.items) + '</p>' +
            '<p class="muted">Notes: ' + (order.notes || '-') + '</p>' +
            '<div class="button-row">' +
            '<select data-order-status="' + order.id + '">' +
            '<option value="new" ' + (order.status === 'new' ? 'selected' : '') + '>new</option>' +
            '<option value="confirmed" ' + (order.status === 'confirmed' ? 'selected' : '') + '>confirmed</option>' +
            '<option value="preparing" ' + (order.status === 'preparing' ? 'selected' : '') + '>preparing</option>' +
            '<option value="delivered" ' + (order.status === 'delivered' ? 'selected' : '') + '>delivered</option>' +
            '<option value="cancelled" ' + (order.status === 'cancelled' ? 'selected' : '') + '>cancelled</option>' +
            '</select>' +
            '<button class="btn btn-secondary" type="button" data-update-order-status="' + order.id + '">Update Status</button>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      ordersList.innerHTML = html;
    } catch (error) {
      ordersList.innerHTML = '<p class="form-status error">' + error.message + '</p>';
    }
  }

  async function boot() {
    try {
      var me = await requestJson('/api/auth/me');
      showDashboard(Boolean(me.authenticated));
      if (me.authenticated) {
        await Promise.all([loadMenu(), loadOrders()]);
      }
    } catch (error) {
      showDashboard(false);
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      var data = new FormData(loginForm);
      var username = String(data.get('username') || '').trim();
      var password = String(data.get('password') || '');

      try {
        await requestJson('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, password: password })
        });
        setStatus(authStatus, 'success', 'Login successful.');
        showDashboard(true);
        await Promise.all([loadMenu(), loadOrders()]);
      } catch (error) {
        setStatus(authStatus, 'error', error.message);
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async function () {
      await requestJson('/api/auth/logout', { method: 'POST' });
      showDashboard(false);
      setStatus(authStatus, 'success', 'Logged out.');
    });
  }

  if (addItemForm) {
    addItemForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      var data = new FormData(addItemForm);
      var payload = {
        name: String(data.get('name') || '').trim(),
        description: String(data.get('description') || '').trim(),
        category: String(data.get('category') || '').trim(),
        price: Number(data.get('price')),
        isAvailable: String(data.get('isAvailable')) === 'true'
      };

      try {
        await requestJson('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        addItemForm.reset();
        setStatus(menuStatus, 'success', 'Menu item added.');
        await loadMenu();
      } catch (error) {
        setStatus(menuStatus, 'error', error.message);
      }
    });
  }

  if (refreshMenuBtn) {
    refreshMenuBtn.addEventListener('click', loadMenu);
  }

  if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener('click', loadOrders);
  }

  document.addEventListener('click', async function (event) {
    var updateItemBtn = event.target.closest('[data-update-item]');
    if (updateItemBtn) {
      var itemId = updateItemBtn.getAttribute('data-update-item');
      var payload = {
        name: document.querySelector('[data-edit-name="' + itemId + '"]').value,
        category: document.querySelector('[data-edit-category="' + itemId + '"]').value,
        price: Number(document.querySelector('[data-edit-price="' + itemId + '"]').value),
        description: document.querySelector('[data-edit-description="' + itemId + '"]').value,
        isAvailable: document.querySelector('[data-edit-available="' + itemId + '"]').value === 'true'
      };
      try {
        await requestJson('/api/admin/menu/' + itemId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await loadMenu();
      } catch (error) {
        setStatus(menuStatus, 'error', error.message);
      }
      return;
    }

    var deleteItemBtn = event.target.closest('[data-delete-item]');
    if (deleteItemBtn) {
      var deleteId = deleteItemBtn.getAttribute('data-delete-item');
      try {
        await requestJson('/api/admin/menu/' + deleteId, { method: 'DELETE' });
        await loadMenu();
      } catch (error) {
        setStatus(menuStatus, 'error', error.message);
      }
      return;
    }

    var updateStatusBtn = event.target.closest('[data-update-order-status]');
    if (updateStatusBtn) {
      var orderId = updateStatusBtn.getAttribute('data-update-order-status');
      var statusNode = document.querySelector('[data-order-status="' + orderId + '"]');
      var status = statusNode ? statusNode.value : 'new';
      try {
        await requestJson('/api/admin/orders/' + orderId + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status })
        });
        await loadOrders();
      } catch (error) {
        ordersList.innerHTML = '<p class="form-status error">' + error.message + '</p>';
      }
    }
  });

  boot();
})();
