(function () {
    const storageKey = 'siteCart';
    const fallbackImage = '/site/assets/img/menu-catalog/image-1.webp';
    const addedButtonLabel = 'У кошику';
    const defaultButtonLabel = 'Додати в кошик';
    const addedIconMarkup =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4H5L6.2 13.2C6.3 14.2 7.1 15 8.1 15H17.5C18.4 15 19.2 14.4 19.4 13.6L21 7H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.6" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="19" r="1.6" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 9.8L11.4 11.7L15 8.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const countTargets = document.querySelectorAll('[data-cart-count]');
    const popupItemsContainer = document.querySelector('[data-cart-items]');
    const popupEmptyState = document.querySelector('[data-cart-empty]');
    const popupTotalValue = document.querySelector('[data-cart-total]');
    const checkoutButton = document.querySelector('[data-cart-checkout]');

    const orderItemsContainer = document.querySelector('[data-order-items]');
    const orderEmptyState = document.querySelector('[data-order-empty]');
    const orderTotalValue = document.querySelector('[data-order-total]');
    const orderCountValue = document.querySelector('[data-order-count]');
    const orderForm = document.querySelector('[data-order-form]');
    const orderCartInput = document.querySelector('[data-order-cart-input]');
    const orderSubmitButton = document.querySelector('[data-order-submit]');
    const orderPayButton = document.querySelector('[data-order-pay]');
    const orderAlert = document.querySelector('[data-order-alert]');
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfTokenMeta
        ? csrfTokenMeta.getAttribute('content')
        : '';

    const formatPrice = (() => {
        const formatter = new Intl.NumberFormat('uk-UA');
        return (value) =>
            `${formatter.format(Math.max(0, Math.round(value)))} грн`;
    })();

    const loadCart = () => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Cannot parse cart from storage', error);
            return [];
        }
    };

    const normalizeStoredCart = (items) => {
        if (!Array.isArray(items)) {
            return [];
        }

        return items
            .filter((item) => item && item.id)
            .map((item) => ({
                id: String(item.id),
                name: item.name || 'Товар',
                price: Number(item.price) || 0,
                image: item.image || fallbackImage,
                url: item.url || '#',
                quantity: Math.max(1, Number(item.quantity) || 1),
            }));
    };

    let cart = normalizeStoredCart(loadCart());

    const saveCart = () => {
        localStorage.setItem(storageKey, JSON.stringify(cart));
    };

    const getTotal = () =>
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const getCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

    const showOrderAlert = (message = '', type = 'error') => {
        if (!orderAlert) {
            return;
        }

        orderAlert.textContent = message || '';
        orderAlert.hidden = !message;
        orderAlert.classList.remove(
            'orderblock__alert--error',
            'orderblock__alert--success',
        );

        if (message) {
            if (type === 'success') {
                orderAlert.classList.add('orderblock__alert--success');
            } else if (type === 'error') {
                orderAlert.classList.add('orderblock__alert--error');
            }
        }
    };

    const updateCounters = () => {
        const count = getCount();
        countTargets.forEach((target) => {
            target.textContent = count;
        });
    };

    const createCartItemMarkup = (item) => `
    <div class="product-cart">
      <figure class="product-cart__img">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </figure>
      <div class="product-cart__body">
        <a href="${item.url}" class="product-cart__name">${item.name}</a>
        <div class="product-cart__meta">Кількість: ${item.quantity}</div>
        <button type="button" class="product-cart__delete" data-remove-from-cart="${item.id}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 21C6.45 21 5.97933 20.8043 5.588 20.413C5.19667 20.0217 5.00067 19.5507 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.8043 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="currentColor"></path>
          </svg>
        </button>
        <div class="product-cart__prices">
          <div class="product-cart__price">${formatPrice(item.price * item.quantity)}</div>
        </div>
      </div>
    </div>
  `;

    const renderPopupCart = () => {
        if (!popupItemsContainer) {
            return;
        }

        popupItemsContainer.innerHTML = '';

        if (!cart.length) {
            popupItemsContainer.classList.add('is-empty');
            if (popupEmptyState) {
                popupEmptyState.style.display = '';
            }
        } else {
            popupItemsContainer.classList.remove('is-empty');
            if (popupEmptyState) {
                popupEmptyState.style.display = 'none';
            }

            cart.forEach((item) => {
                popupItemsContainer.insertAdjacentHTML(
                    'beforeend',
                    createCartItemMarkup(item),
                );
            });
        }

        if (popupTotalValue) {
            popupTotalValue.textContent = formatPrice(getTotal());
        }
    };

    const renderOrderCart = () => {
        if (
            !orderItemsContainer &&
            !orderEmptyState &&
            !orderTotalValue &&
            !orderCountValue &&
            !orderCartInput
        ) {
            return;
        }

        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = '';
        }

        if (!cart.length) {
            if (orderEmptyState) {
                orderEmptyState.style.display = '';
            }
        } else {
            if (orderEmptyState) {
                orderEmptyState.style.display = 'none';
            }

            if (orderItemsContainer) {
                cart.forEach((item) => {
                    orderItemsContainer.insertAdjacentHTML(
                        'beforeend',
                        createCartItemMarkup(item),
                    );
                });
            }
        }

        if (orderTotalValue) {
            orderTotalValue.textContent = formatPrice(getTotal());
        }

        if (orderCountValue) {
            orderCountValue.textContent = `${getCount()}`;
        }

        if (orderCartInput) {
            orderCartInput.value = cart.length ? JSON.stringify(cart) : '';
        }
    };

    const updateCheckoutState = () => {
        if (orderSubmitButton) {
            orderSubmitButton.disabled = cart.length === 0;
        }
    };

    const updateAddToCartButtons = () => {
        const buttons = document.querySelectorAll('[data-add-to-cart]');
        const cartIds = new Set(cart.map((item) => String(item.id)));

        buttons.forEach((button) => {
            const id = button.dataset.productId;
            if (!id) {
                return;
            }

            const isInCart = cartIds.has(id);
            button.classList.toggle('is-active', isInCart);

            const textTarget = button.querySelector('[data-button-text]');
            if (textTarget) {
                if (!textTarget.dataset.defaultLabel) {
                    textTarget.dataset.defaultLabel =
                        textTarget.textContent.trim() || defaultButtonLabel;
                }
                textTarget.textContent = isInCart
                    ? addedButtonLabel
                    : textTarget.dataset.defaultLabel;
            } else {
                if (!button.dataset.defaultIcon) {
                    button.dataset.defaultIcon = button.innerHTML.trim();
                }
                if (!button.dataset.addedIcon) {
                    button.dataset.addedIcon = addedIconMarkup;
                }
                button.innerHTML = isInCart
                    ? button.dataset.addedIcon
                    : button.dataset.defaultIcon;
            }

            button.setAttribute(
                'aria-label',
                isInCart ? 'Товар у кошику' : defaultButtonLabel,
            );
        });
    };

    const refreshUI = () => {
        updateCounters();
        renderPopupCart();
        renderOrderCart();
        updateAddToCartButtons();
        updateCheckoutState();
    };

    const sync = () => {
        saveCart();
        refreshUI();
    };

    const prepareProductPayload = (product) => ({
        id: String(product.id),
        name: product.name || 'Товар',
        price: Number(product.price) || 0,
        image: product.image || fallbackImage,
        url: product.url || '#',
    });

    const addToCart = (product) => {
        if (!product.id) {
            return;
        }

        const id = String(product.id);
        const existing = cart.find((item) => item.id === id);

        if (existing) {
            existing.quantity = 1;
            sync();
            return;
        }

        cart.push({
            ...prepareProductPayload(product),
            quantity: 1,
        });

        sync();
    };

    const removeFromCart = (id) => {
        const targetId = String(id);
        cart = cart.filter((item) => item.id !== targetId);
        sync();
    };

    const isInCart = (id) => cart.some((item) => item.id === String(id));

    document.addEventListener('click', (event) => {
        const addButton = event.target.closest('[data-add-to-cart]');
        if (addButton) {
            event.preventDefault();
            const product = {
                id: addButton.dataset.productId,
                name: addButton.dataset.productName,
                price: parseFloat(addButton.dataset.productPrice || '0'),
                image: addButton.dataset.productImage || fallbackImage,
                url: addButton.dataset.productUrl || '#',
            };
            if (isInCart(product.id)) {
                removeFromCart(product.id);
            } else {
                addToCart(product);
            }
            return;
        }

        const removeButton = event.target.closest('[data-remove-from-cart]');
        if (removeButton) {
            event.preventDefault();
            removeFromCart(removeButton.getAttribute('data-remove-from-cart'));
        }
    });

    if (checkoutButton) {
        checkoutButton.addEventListener('click', (event) => {
            if (!cart.length) {
                event.preventDefault();
                showOrderAlert('Додайте хоча б один товар до кошика.', 'error');
            }
        });
    }

    if (orderForm) {
        orderForm.addEventListener('submit', (event) => {
            if (!cart.length) {
                event.preventDefault();
                showOrderAlert('Додайте хоча б один товар до кошика.', 'error');
            }
        });
    }

    const handlePaymentRequest = async () => {
        if (!orderPayButton || !orderPayButton.dataset.payUrl) {
            return;
        }

        const loadingClass = 'is-loading';
        orderPayButton.disabled = true;
        orderPayButton.classList.add(loadingClass);

        try {
            const response = await fetch(orderPayButton.dataset.payUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({}),
                credentials: 'same-origin',
            });

            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : null;

            if (!response.ok) {
                throw new Error(
                    (payload && payload.message) ||
                        'Не вдалося розпочати оплату.',
                );
            }

            if (payload && payload.payment_url) {
                window.location.href = payload.payment_url;
                return;
            }

            throw new Error('Сервіс оплати не повернув посилання.');
        } catch (error) {
            showOrderAlert(
                error.message || 'Не вдалося розпочати оплату.',
                'error',
            );
        } finally {
            orderPayButton.disabled = false;
            orderPayButton.classList.remove(loadingClass);
        }
    };

    if (orderPayButton && !orderPayButton.hasAttribute('hidden')) {
        orderPayButton.addEventListener('click', (event) => {
            event.preventDefault();
            handlePaymentRequest();
        });
    }

    refreshUI();
})();
