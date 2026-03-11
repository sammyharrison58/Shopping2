
// State Management
let cart = JSON.parse(localStorage.getItem('shoemall_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('shoemall_user')) || null;
let orders = JSON.parse(localStorage.getItem('shoemall_orders')) || [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initFilter();
    initSearch();
    initAddToCart();
    initCartDrawer();
    initAuth();
});

// --- Authentication & Order History Logic ---
function initAuth() {
    // Inject Auth Modal if not present
    if (!document.getElementById('auth-modal-overlay')) {
        const authHTML = `
            <div class="modal-overlay" id="auth-modal-overlay">
                <div class="auth-modal">
                    <button class="close-modal">&times;</button>
                    <!-- Auth View (Login/Signup) -->
                    <div id="auth-main-view">
                        <h2 id="auth-title">Welcome to ShoeMall</h2>
                        <div class="auth-tabs">
                            <div class="auth-tab active" data-mode="login">Login</div>
                            <div class="auth-tab" data-mode="signup">Sign Up</div>
                        </div>
                        <form class="auth-form" id="auth-form">
                            <input type="text" id="auth-email" placeholder="Email Address" required>
                            <input type="password" id="auth-pass" placeholder="Password" required>
                            <button type="submit" class="auth-submit">Continue</button>
                        </form>
                    </div>
                    <!-- Order History View -->
                    <div id="orders-view" style="display: none;">
                        <h2 style="margin-bottom: 20px; text-align: center;">My Order History</h2>
                        <div id="orders-list" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                            <!-- Orders injected here -->
                        </div>
                        <button class="auth-submit" id="back-to-auth" style="margin-top: 20px;">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', authHTML);
    }

    const overlay = document.getElementById('auth-modal-overlay');
    const closeBtn = overlay.querySelector('.close-modal');
    const tabs = overlay.querySelectorAll('.auth-tab');
    const form = document.getElementById('auth-form');
    const backBtn = document.getElementById('back-to-auth');
    let currentMode = 'login';

    // Header Account Button Click
    const accountBtns = document.querySelectorAll('.action-item:first-child'); 
    accountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            overlay.classList.add('show');
            if (currentUser) {
                showView('orders');
            } else {
                showView('auth');
            }
        });
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('show');
    });

    backBtn.addEventListener('click', () => overlay.classList.remove('show'));

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.dataset.mode;
            document.getElementById('auth-title').textContent = currentMode === 'login' ? 'Welcome Back' : 'Create Account';
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;

        if (currentMode === 'signup') {
            currentUser = { email, pass };
            localStorage.setItem('shoemall_user', JSON.stringify(currentUser));
            showToast('Account created successfully!');
        } else {
            const savedUser = JSON.parse(localStorage.getItem('shoemall_user'));
            if (savedUser && savedUser.email === email && savedUser.pass === pass) {
                currentUser = savedUser;
                showToast('Welcome back!');
            } else {
                showToast('Invalid credentials. (Try signing up first)');
                return;
            }
        }
        
        updateUserUI();
        showView('orders');
    });

    updateUserUI();
}

function showView(view) {
    const authView = document.getElementById('auth-main-view');
    const ordersView = document.getElementById('orders-view');
    if (view === 'orders') {
        authView.style.display = 'none';
        ordersView.style.display = 'block';
        renderOrderHistory();
    } else {
        authView.style.display = 'block';
        ordersView.style.display = 'none';
    }
}

function renderOrderHistory() {
    const list = document.getElementById('orders-list');
    const userOrders = orders.filter(o => o.user === currentUser?.email);

    if (userOrders.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">No transaction history found.</p>';
        return;
    }

    list.innerHTML = userOrders.map(order => `
        <div class="order-item-card" style="border: 1px solid #eee; padding: 15px; border-radius: 10px; margin-bottom: 12px; background: #fdfdfd;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 800; color: var(--primary-red); font-size: 0.9rem;">ORDER ID: #${order.id}</span>
                <span style="font-size: 0.75rem; color: #999;">${order.date}</span>
            </div>
            <div style="font-size: 0.85rem; color: #555; margin-bottom: 10px; line-height: 1.4;">
                ${order.items.map(i => `<span style="display:block;">• ${i.title} (x${i.quantity})</span>`).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #eee; padding-top: 10px; margin-top: 5px;">
                <span style="font-weight: 800; font-size: 1.1rem; color: #222;">${order.total}</span>
                <button class="view-receipt-btn" style="background:none; border:none; color: #007bff; cursor: pointer; font-size: 0.8rem; font-weight: 600; text-decoration: underline;" onclick="reDownload('${order.id}')">Download Receipt</button>
            </div>
        </div>
    `).join('');
}

window.reDownload = function(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) downloadReceipt(order.id, order.total, order.items);
};

function logout() {
    currentUser = null;
    updateUserUI();
    showToast('Logged out safely.');
    document.getElementById('auth-modal-overlay').classList.remove('show');
}

function updateUserUI() {
    const accountBtn = document.querySelector('.header-actions .action-item:first-child');
    if (!accountBtn) return;

    if (currentUser) {
        accountBtn.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <i class="fas fa-user-circle" style="color: var(--primary-red); font-size: 1.2rem;"></i>
                <span style="font-size: 0.8rem; font-weight: 700;">${currentUser.email.split('@')[0]}</span>
                <small class="logout-link" style="font-size: 8px; color: #999; text-decoration: underline;">Logout</small>
            </div>
        `;
        accountBtn.querySelector('.logout-link').onclick = (e) => {
            e.stopPropagation();
            logout();
        };
    } else {
        accountBtn.innerHTML = `<i class="far fa-user"></i> <span>Account</span>`;
    }
}

// --- Cart Core Logic ---
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'block' : 'none';
    });
}

function initAddToCart() {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;

    productGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;

        const card = btn.closest('.product-card');
        const product = {
            id: card.dataset.id || Math.random().toString(36).substr(2, 9),
            title: card.querySelector('.product-title').textContent,
            price: card.querySelector('.current-price').textContent,
            image: card.querySelector('img').src,
            quantity: 1
        };

        const existing = cart.find(item => item.id === product.id);
        if (existing) existing.quantity += 1;
        else cart.push(product);

        saveCart();
        renderCartItems();
        showToast(`Added to cart!`);
    });
}

function saveCart() {
    localStorage.setItem('shoemall_cart', JSON.stringify(cart));
    updateCartCount();
}

// --- Cart Drawer Interface ---
function initCartDrawer() {
    if (!document.getElementById('cart-drawer')) {
        const drawerHTML = `
            <div class="cart-drawer-overlay" id="drawer-overlay"></div>
            <div id="cart-drawer">
                <div class="drawer-header">
                    <h3>Your Selection</h3>
                    <button class="close-drawer">&times;</button>
                </div>
                <div class="cart-items-list"></div>
                <div class="drawer-footer">
                    <div class="cart-total">
                        <span>Total Payable:</span>
                        <span id="drawer-total-price">$0.00</span>
                    </div>
                    <button class="checkout-btn">Checkout Now</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', drawerHTML);
    }

    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = drawer.querySelector('.close-drawer');
    const cartIcons = document.querySelectorAll('.cart-icon');

    const toggle = () => {
        drawer.classList.toggle('show');
        overlay.classList.toggle('show');
        if (drawer.classList.contains('show')) renderCartItems();
    };

    cartIcons.forEach(i => i.onclick = (e) => { e.preventDefault(); toggle(); });
    closeBtn.onclick = toggle;
    overlay.onclick = toggle;

    // Checkout logic
    drawer.querySelector('.checkout-btn').onclick = () => {
        if (!currentUser) {
            showToast('Login to complete order');
            document.getElementById('auth-modal-overlay').classList.add('show');
            showView('auth');
            return;
        }
        if (cart.length === 0) return showToast('Cart is empty!');

        const total = document.getElementById('drawer-total-price').textContent;
        const msg = `PAYMENT REQUIRED\n----------------\nTotal: ${total}\n\nM-Pesa Paybill: 7382528\nAccount: ${currentUser.email.split('@')[0]}\n\nClick OK once paid.`;

        if (confirm(msg)) {
            const orderID = 'SMS-' + Math.floor(10000 + Math.random() * 90000);
            const orderData = {
                id: orderID,
                date: new Date().toLocaleString(),
                user: currentUser.email,
                total: total,
                items: [...cart]
            };

            orders.unshift(orderData);
            localStorage.setItem('shoemall_orders', JSON.stringify(orders));
            
            downloadReceipt(orderID, total, cart);
            showToast('Order successful! Receipt downloaded.');
            
            cart = [];
            saveCart();
            renderCartItems();
            setTimeout(toggle, 1000);
        }
    };

    // Item controls
    drawer.querySelector('.cart-items-list').onclick = (e) => {
        const id = e.target.dataset.id;
        const item = cart.find(i => i.id === id);
        if (!item) return;

        if (e.target.classList.contains('plus-qty')) item.quantity++;
        else if (e.target.classList.contains('minus-qty')) item.quantity--;
        else if (e.target.classList.contains('remove-item')) {
            cart = cart.filter(i => i.id !== id);
        }

        if (item && item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        
        saveCart();
        renderCartItems();
    };

    renderCartItems();
}

function renderCartItems() {
    const list = document.querySelector('.cart-items-list');
    const totalEl = document.getElementById('drawer-total-price');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; margin-top: 50px;">Empty Plate</p>';
        totalEl.textContent = '$0.00';
        return;
    }

    let totalVal = 0;
    list.innerHTML = cart.map(item => {
        const price = parseFloat(item.price.replace('$', ''));
        totalVal += price * item.quantity;
        return `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${item.price}</div>
                    <div class="cart-item-actions">
                        <button class="qty-btn minus-qty" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn plus-qty" data-id="${item.id}">+</button>
                        <span class="remove-item" data-id="${item.id}">Remove</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    totalEl.textContent = `$${totalVal.toFixed(2)}`;
}

// --- Utilities ---
function downloadReceipt(id, total, items) {
    const content = `SHOEMALL AFRICA\nORDER #${id}\nDATE: ${new Date().toLocaleString()}\nCUSTOMER: ${currentUser?.email}\n------------------\n${items.map(i => `${i.title} x${i.quantity} @ ${i.price}`).join('\n')}\n------------------\nTOTAL: ${total}\nPAYBILL: 7382528\n------------------\nThank you!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ShoeMall_Receipt_${id}.txt`;
    a.click();
}

function initFilter() {
    const links = document.querySelectorAll('.side-nav a');
    const cards = document.querySelectorAll('.product-card');
    links.forEach(l => l.onclick = (e) => {
        e.preventDefault();
        links.forEach(x => x.classList.remove('active-filter'));
        l.classList.add('active-filter');
        const cat = l.textContent.trim().toLowerCase();
        cards.forEach(c => {
            const cardCat = c.dataset.category?.toLowerCase() || '';
            c.style.display = (cat === 'all categories' || cat === 'new arrivals' || cardCat.includes(cat) || cat.includes(cardCat)) ? 'flex' : 'none';
        });
    });
}

function initSearch() {
    const input = document.querySelector('.search-bar input');
    const btn = document.querySelector('.search-btn');
    const cards = document.querySelectorAll('.product-card');
    const runSearch = () => {
        const q = input.value.toLowerCase().trim();
        if (!document.querySelector('.product-grid')) {
            window.location.href = `index.html?search=${encodeURIComponent(q)}`;
            return;
        }
        let count = 0;
        cards.forEach(c => {
            const hasQ = c.innerText.toLowerCase().includes(q);
            c.style.display = hasQ ? 'flex' : 'none';
            if (hasQ) count++;
        });
        if (count === 0 && q !== '') showToast('No matches');
    };
    if (btn) btn.onclick = runSearch;
    if (input) input.onkeyup = (e) => { if (e.key === 'Enter') runSearch(); };
    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) { input.value = params.get('search'); setTimeout(runSearch, 100); }
}

function showToast(m) {
    const t = document.createElement('div');
    t.className = 'cart-toast';
    t.innerHTML = `<i class="fas fa-check-circle"></i> ${m}`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 100);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 2500);
}
