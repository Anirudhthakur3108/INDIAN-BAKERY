(async function () {
  var template = window.BAKERY_TEMPLATE || {};
  var contact = template.contact || {};
  var features = template.features || {};
  var ORDER_SELECTION_KEY = 'bakery:selected-menu-items';

  function bindText(selector, value) {
    if (!value && value !== 0) {
      return;
    }
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function removeWhenDisabled(selector, flag) {
    if (flag === false) {
      document.querySelectorAll(selector).forEach(function (node) {
        node.remove();
      });
    }
  }

  function applyTemplateConfig() {
    bindText('[data-template="brand-name"]', template.brandName);
    bindText('[data-template="brand-initials"]', template.brandInitials);
    bindText('[data-template="city"]', template.city);
    bindText('[data-template="hero-tagline"]', template.heroTagline);

    bindText('[data-template="contact-address"]', contact.address);
    bindText('[data-template="contact-phone"]', contact.phone);
    bindText('[data-template="contact-email"]', contact.email);
    bindText('[data-template="contact-hours"]', contact.hours);
    bindText('[data-template="contact-landmark"]', contact.mapLandmark);

    removeWhenDisabled('[data-feature="custom-orders-card"]', features.showCustomOrdersCard);
    removeWhenDisabled('[data-feature="map-placeholder"]', features.showMapPlaceholder);

    if (template.brandName) {
      document.title = document.title.replace(/Rajwadi Oven/g, template.brandName);
    }
  }

  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.querySelector('[data-nav-menu]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function readSelectedItems() {
    try {
      var raw = localStorage.getItem(ORDER_SELECTION_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeSelectedItems(items) {
    localStorage.setItem(ORDER_SELECTION_KEY, JSON.stringify(items));
  }

  function formatInr(amount) {
    return 'INR ' + Math.round(Number(amount) || 0);
  }

  function priceToNumber(price) {
    if (typeof price === 'number') {
      return price;
    }
    if (typeof price === 'string') {
      var cleaned = price.replace(/[^\d.]/g, '');
      var parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function buildSectionsFromTemplate() {
    if (!Array.isArray(template.menuSections)) {
      return [];
    }
    return template.menuSections.map(function (section) {
      return {
        title: section.title || 'Menu Section',
        items: Array.isArray(section.items)
          ? section.items.map(function (item) {
              return {
                name: item.name || 'Item Name',
                description: item.description || '',
                price: priceToNumber(item.price),
              };
            })
          : [],
      };
    });
  }

  async function getMenuSections() {
    try {
      var response = await fetch('/api/menu');
      if (!response.ok) {
        throw new Error('Menu API unavailable');
      }
      var data = await response.json();
      if (!Array.isArray(data.sections)) {
        throw new Error('Invalid menu response');
      }
      return data.sections.map(function (section) {
        return {
          title: section.title || 'Menu Section',
          items: Array.isArray(section.items)
            ? section.items.map(function (item) {
                return {
                  id: item.id,
                  name: item.name || 'Item Name',
                  description: item.description || '',
                  price: priceToNumber(item.price),
                };
              })
            : [],
        };
      });
    } catch (error) {
      return buildSectionsFromTemplate();
    }
  }

  function renderMenuSections(sections) {
    var menuContainer = document.querySelector('[data-menu-sections]');
    if (!menuContainer) {
      return;
    }

    menuContainer.innerHTML = '';
    sections.forEach(function (section) {
      var sectionNode = document.createElement('section');
      sectionNode.className = 'section';

      var heading = document.createElement('h2');
      heading.textContent = section.title;
      sectionNode.appendChild(heading);

      var grid = document.createElement('div');
      grid.className = 'grid grid-3';

      section.items.forEach(function (item, index) {
        var card = document.createElement('article');
        card.className = 'card reveal';
        if (index % 3 === 1) {
          card.className += ' delay-1';
        }
        if (index % 3 === 2) {
          card.className += ' delay-2';
        }

        var name = document.createElement('h3');
        name.textContent = item.name;
        card.appendChild(name);

        var description = document.createElement('p');
        description.textContent = item.description;
        card.appendChild(description);

        var priceNode = document.createElement('p');
        priceNode.className = 'price';
        priceNode.textContent = formatInr(item.price);
        card.appendChild(priceNode);

        var addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn btn-secondary menu-add-btn';
        addButton.setAttribute('data-add-item', item.name);
        addButton.setAttribute('data-add-price', String(item.price));
        addButton.textContent = 'Add to Order';
        card.appendChild(addButton);

        grid.appendChild(card);
      });

      sectionNode.appendChild(grid);
      menuContainer.appendChild(sectionNode);
    });
  }

  function populateOrderItemSelect(sections) {
    var select = document.querySelector('[data-order-items]');
    if (!select) {
      return;
    }

    var previous = select.value;
    select.innerHTML = '<option value="">Choose one</option>';

    sections.forEach(function (section) {
      section.items.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name + ' (' + formatInr(item.price) + ')';
        option.setAttribute('data-price', String(item.price));
        select.appendChild(option);
      });
    });

    if (previous) {
      select.value = previous;
    }
  }

  function initMenuOrderBuilder() {
    var builder = document.querySelector('[data-menu-order-builder]');
    if (!builder) {
      return;
    }

    var list = builder.querySelector('[data-order-builder-list]');
    var clearButton = builder.querySelector('[data-clear-order]');
    var proceedLink = builder.querySelector('[data-proceed-order]');

    function renderBuilder() {
      var items = readSelectedItems();
      if (!list) {
        return;
      }

      list.innerHTML = '';
      if (items.length === 0) {
        var emptyItem = document.createElement('li');
        emptyItem.className = 'muted';
        emptyItem.textContent = 'No items selected yet.';
        list.appendChild(emptyItem);
      } else {
        items.forEach(function (entry) {
          var item = document.createElement('li');

          var name = document.createElement('span');
          name.className = 'selected-item-name';
          name.textContent = entry.name + ' x ' + entry.qty;
          item.appendChild(name);

          var controls = document.createElement('div');
          controls.className = 'qty-controls';

          var minus = document.createElement('button');
          minus.type = 'button';
          minus.className = 'qty-btn';
          minus.setAttribute('data-item-action', 'decrease');
          minus.setAttribute('data-item-name', entry.name);
          minus.textContent = '-';
          controls.appendChild(minus);

          var plus = document.createElement('button');
          plus.type = 'button';
          plus.className = 'qty-btn';
          plus.setAttribute('data-item-action', 'increase');
          plus.setAttribute('data-item-name', entry.name);
          plus.textContent = '+';
          controls.appendChild(plus);

          var remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'qty-btn qty-remove';
          remove.setAttribute('data-item-action', 'remove');
          remove.setAttribute('data-item-name', entry.name);
          remove.textContent = 'x';
          controls.appendChild(remove);

          item.appendChild(controls);
          list.appendChild(item);
        });
      }

      if (proceedLink) {
        var disabled = items.length === 0;
        proceedLink.setAttribute('aria-disabled', String(disabled));
        proceedLink.classList.toggle('is-disabled', disabled);
      }
    }

    document.addEventListener('click', function (event) {
      var addButton = event.target.closest('[data-add-item]');
      if (addButton) {
        var itemName = addButton.getAttribute('data-add-item');
        var itemPrice = priceToNumber(addButton.getAttribute('data-add-price'));
        if (!itemName) {
          return;
        }

        var items = readSelectedItems();
        var found = items.find(function (entry) {
          return entry.name === itemName;
        });
        if (found) {
          found.qty += 1;
        } else {
          items.push({ name: itemName, qty: 1, price: itemPrice });
        }

        writeSelectedItems(items);
        renderBuilder();
        return;
      }

      var actionButton = event.target.closest('[data-item-action]');
      if (!actionButton) {
        return;
      }

      var action = actionButton.getAttribute('data-item-action');
      var itemName = actionButton.getAttribute('data-item-name');
      if (!action || !itemName) {
        return;
      }

      var currentItems = readSelectedItems();
      var target = currentItems.find(function (entry) {
        return entry.name === itemName;
      });
      if (!target) {
        return;
      }

      if (action === 'increase') {
        target.qty += 1;
      }
      if (action === 'decrease') {
        target.qty -= 1;
      }
      if (action === 'remove' || target.qty <= 0) {
        currentItems = currentItems.filter(function (entry) {
          return entry.name !== itemName;
        });
      }

      writeSelectedItems(currentItems);
      renderBuilder();
    });

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        writeSelectedItems([]);
        renderBuilder();
      });
    }

    if (proceedLink) {
      proceedLink.addEventListener('click', function (event) {
        if (readSelectedItems().length === 0) {
          event.preventDefault();
        }
      });
    }

    renderBuilder();
  }

  function initOrderForm() {
    var orderForm = document.querySelector('[data-order-form]');
    if (!orderForm) {
      return;
    }

    var status = orderForm.querySelector('[data-form-status]');
    var itemSelect = orderForm.querySelector('[data-order-items]');
    var quantityInput = orderForm.querySelector('[data-item-qty]');
    var notesInput = orderForm.querySelector('[name="notes"]');
    var selectedItemsList = orderForm.querySelector('[data-selected-items-list]');
    var addOrderItemButton = orderForm.querySelector('[data-add-order-item]');
    var orderTypeSelect = orderForm.querySelector('[data-order-type]');
    var scheduleFields = orderForm.querySelector('[data-schedule-fields]');
    var dateInput = orderForm.querySelector('[data-date-input]');
    var slotInput = orderForm.querySelector('[data-slot-input]');
    var deliveryAddressField = orderForm.querySelector('[data-delivery-address-field]');
    var deliveryAddressInput = orderForm.querySelector('[data-delivery-address]');
    var summaryCount = orderForm.querySelector('[data-order-summary-count]');
    var summaryTotal = orderForm.querySelector('[data-order-summary-total]');

    var selectedItems = readSelectedItems();

    function setFieldError(fieldName, message) {
      var errorNode = orderForm.querySelector('[data-error-for="' + fieldName + '"]');
      if (errorNode) {
        errorNode.textContent = message || '';
      }
    }

    function calcTotals(items) {
      return items.reduce(
        function (acc, item) {
          acc.count += Number(item.qty) || 0;
          acc.total += (Number(item.qty) || 0) * (priceToNumber(item.price) || 0);
          return acc;
        },
        { count: 0, total: 0 }
      );
    }

    function renderSelectedItems() {
      if (!selectedItemsList) {
        return;
      }

      selectedItemsList.innerHTML = '';
      if (selectedItems.length === 0) {
        var empty = document.createElement('li');
        empty.className = 'muted';
        empty.textContent = 'No items added yet.';
        selectedItemsList.appendChild(empty);
      } else {
        selectedItems.forEach(function (entry) {
          var item = document.createElement('li');
          var name = document.createElement('span');
          name.className = 'selected-item-name';
          name.textContent = entry.name + ' x ' + entry.qty + ' (' + formatInr((entry.price || 0) * entry.qty) + ')';
          item.appendChild(name);

          var controls = document.createElement('div');
          controls.className = 'qty-controls';

          var minus = document.createElement('button');
          minus.type = 'button';
          minus.className = 'qty-btn';
          minus.textContent = '-';
          minus.setAttribute('data-order-item-action', 'decrease');
          minus.setAttribute('data-order-item-name', entry.name);
          controls.appendChild(minus);

          var plus = document.createElement('button');
          plus.type = 'button';
          plus.className = 'qty-btn';
          plus.textContent = '+';
          plus.setAttribute('data-order-item-action', 'increase');
          plus.setAttribute('data-order-item-name', entry.name);
          controls.appendChild(plus);

          var remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'qty-btn qty-remove';
          remove.textContent = 'x';
          remove.setAttribute('data-order-item-action', 'remove');
          remove.setAttribute('data-order-item-name', entry.name);
          controls.appendChild(remove);

          item.appendChild(controls);
          selectedItemsList.appendChild(item);
        });
      }

      var totals = calcTotals(selectedItems);
      if (summaryCount) {
        summaryCount.textContent = String(totals.count);
      }
      if (summaryTotal) {
        summaryTotal.textContent = formatInr(totals.total);
      }
    }

    function persistSelectedItems() {
      writeSelectedItems(selectedItems);
      renderSelectedItems();
    }

    function toggleScheduleVisibility() {
      var orderType = orderTypeSelect ? orderTypeSelect.value : '';
      var showSchedule = orderType === 'pickup' || orderType === 'delivery';
      var showAddress = orderType === 'delivery';

      if (scheduleFields) {
        scheduleFields.hidden = !showSchedule;
      }
      if (deliveryAddressField) {
        deliveryAddressField.hidden = !showAddress;
      }

      if (!showSchedule) {
        if (dateInput) {
          dateInput.value = '';
        }
        if (slotInput) {
          slotInput.value = '';
        }
      }

      if (!showAddress && deliveryAddressInput) {
        deliveryAddressInput.value = '';
      }
    }

    if (selectedItems.length > 0 && notesInput) {
      notesInput.value = 'Selected from menu: ' + selectedItems.map(function (item) {
        return item.name + ' x ' + item.qty;
      }).join(', ');
    }

    renderSelectedItems();

    if (orderTypeSelect) {
      orderTypeSelect.addEventListener('change', toggleScheduleVisibility);
      toggleScheduleVisibility();
    }

    if (addOrderItemButton) {
      addOrderItemButton.addEventListener('click', function () {
        var selectedOption = itemSelect ? itemSelect.options[itemSelect.selectedIndex] : null;
        var selectedName = selectedOption ? String(selectedOption.value || '').trim() : '';
        var itemPrice = selectedOption ? priceToNumber(selectedOption.getAttribute('data-price')) : 0;
        var qty = quantityInput ? Number(quantityInput.value) : 0;

        setFieldError('orderItems', '');

        if (!selectedName) {
          setFieldError('orderItems', 'Please select an item before adding.');
          return;
        }

        if (!qty || qty < 1) {
          setFieldError('orderItems', 'Quantity must be at least 1.');
          return;
        }

        var existing = selectedItems.find(function (entry) {
          return entry.name === selectedName;
        });
        if (existing) {
          existing.qty += qty;
          if (!existing.price) {
            existing.price = itemPrice;
          }
        } else {
          selectedItems.push({ name: selectedName, qty: qty, price: itemPrice });
        }

        persistSelectedItems();
        if (quantityInput) {
          quantityInput.value = '1';
        }
      });
    }

    if (selectedItemsList) {
      selectedItemsList.addEventListener('click', function (event) {
        var actionButton = event.target.closest('[data-order-item-action]');
        if (!actionButton) {
          return;
        }

        var action = actionButton.getAttribute('data-order-item-action');
        var itemName = actionButton.getAttribute('data-order-item-name');
        if (!action || !itemName) {
          return;
        }

        var target = selectedItems.find(function (entry) {
          return entry.name === itemName;
        });
        if (!target) {
          return;
        }

        if (action === 'increase') {
          target.qty += 1;
        }
        if (action === 'decrease') {
          target.qty -= 1;
        }
        if (action === 'remove' || target.qty <= 0) {
          selectedItems = selectedItems.filter(function (entry) {
            return entry.name !== itemName;
          });
        }

        persistSelectedItems();
      });
    }

    function validate(values) {
      var errors = {};

      if (!values.customerName || values.customerName.length < 2) {
        errors.customerName = 'Please enter your full name / apna pura naam dalo.';
      }

      if (!/^\d{10}$/.test(values.phone)) {
        errors.phone = 'Please enter a valid 10-digit Indian phone number.';
      }

      if (!Array.isArray(values.items) || values.items.length === 0) {
        errors.orderItems = 'Please add at least one item to your order.';
      }

      if (!values.orderType) {
        errors.orderType = 'Please choose pickup or delivery.';
      }

      if (!values.pickupDate) {
        errors.pickupDate = 'Please pick a date for delivery or pickup.';
      }

      if (!values.slot) {
        errors.slot = 'Please select a preferred slot.';
      }

      if (values.orderType === 'delivery' && (!values.deliveryAddress || values.deliveryAddress.length < 8)) {
        errors.deliveryAddress = 'Please enter a complete delivery address.';
      }

      return errors;
    }

    orderForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      var formData = new FormData(orderForm);
      var values = {
        customerName: String(formData.get('customerName') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        orderType: String(formData.get('orderType') || '').trim(),
        pickupDate: String(formData.get('pickupDate') || '').trim(),
        slot: String(formData.get('slot') || '').trim(),
        deliveryAddress: String(formData.get('deliveryAddress') || '').trim(),
        items: selectedItems.map(function (item) {
          return { name: item.name, qty: item.qty, price: item.price || 0 };
        }),
        notes: String(formData.get('notes') || '').trim(),
      };

      ['customerName', 'phone', 'orderItems', 'orderType', 'pickupDate', 'slot', 'deliveryAddress'].forEach(function (field) {
        setFieldError(field, '');
      });

      var errors = validate(values);
      var errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        errorKeys.forEach(function (key) {
          setFieldError(key, errors[key]);
        });
        if (status) {
          status.className = 'form-status error';
          status.textContent = 'Please fix the highlighted fields and try again.';
        }
        return;
      }

      try {
        var response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        var data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error(data.error || 'Order submission failed');
        }

        if (status) {
          status.className = 'form-status success';
          status.textContent = 'Order placed successfully. Order ID: ' + data.orderId;
        }

        selectedItems = [];
        writeSelectedItems([]);
        renderSelectedItems();
        orderForm.reset();
        toggleScheduleVisibility();
      } catch (error) {
        if (status) {
          status.className = 'form-status error';
          status.textContent = error.message;
        }
      }
    });
  }

  applyTemplateConfig();
  initNav();

  var sections = await getMenuSections();
  renderMenuSections(sections);
  populateOrderItemSelect(sections);

  initMenuOrderBuilder();
  initOrderForm();
})();
