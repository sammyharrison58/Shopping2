
// State Management
let cart = JSON.parse(localStorage.getItem('shoemall_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('shoemall_user')) || null;
let allUsers = JSON.parse(localStorage.getItem('shoemall_all_users')) || [];
let orders = JSON.parse(localStorage.getItem('shoemall_orders')) || [];

const ADMIN_EMAIL = "sammyharrison58@gmail.com";

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initFilter();
    initSearch();
    initAddToCart();
    initCartDrawer();
    initAuth();
});

// --- Authentication & Admin Logic ---
function initAuth() {
    if (!document.getElementById('auth-modal-overlay')) {
        const authHTML = `
            <div class="modal-overlay" id="auth-modal-overlay">
                <div class="auth-modal" style="max-width: 600px;">
                    <button class="close-modal">&times;</button>
                    
                    <!-- View 1: Auth (Login/Signup) -->
                    <div id="auth-main-view">
                        <h2 id="auth-title">Welcome to ShoeMall</h2>
                        <div class="auth-tabs">
                            <div class="auth-tab active" data-mode="login">Login</div>
                            <div class="auth-tab" data-mode="signup">Sign Up</div>
                        </div>
                        <form class="auth-form" id="auth-form">
                            <input type="email" id="auth-email" placeholder="Email Address" required>
                            <input type="password" id="auth-pass" placeholder="Password" required>
                            <button type="submit" class="auth-submit">Continue</button>
                        </form>
                    </div>

                    <!-- View 2: User Order History -->
                    <div id="orders-view" style="display: none;">
                        <h2 style="margin-bottom: 20px; text-align: center;">My Order History</h2>
                        <div id="orders-list" style="max-height: 400px; overflow-y: auto;"></div>
                        <button class="auth-submit" id="close-orders" style="margin-top: 20px;">Close</button>
                    </div>

                    <!-- View 3: Admin Dashboard -->
                    <div id="admin-view" style="display: none;">
                        <h2 style="margin-bottom: 20px; text-align: center;">System Administration</h2>
                        
                        <div class="admin-stats">
                            <div class="stat-card">
                                <h4>Total Revenue</h4>
                                <p id="admin-stat-revenue">$0.00</p>
                            </div>
                            <div class="stat-card">
                                <h4>Total Customers</h4>
                                <p id="admin-stat-users">0</p>
                            </div>
                        </div>

                        <div class="admin-tabs">
                            <button class="admin-tab-btn active" onclick="switchAdminTab('orders')">System Orders</button>
                            <button class="admin-tab-btn" onclick="switchAdminTab('customers')">Customer Cloud</button>
                        </div>

                        <div id="admin-content" class="admin-table-container">
                            <!-- Injected Tables -->
                        </div>
                        <button class="auth-submit" id="close-admin" style="margin-top: 20px;">Exit Dashboard</button>
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
    const adminExit = document.getElementById('close-admin');
    const orderExit = document.getElementById('close-orders');

    const accountBtns = document.querySelectorAll('.action-item:first-child'); 
    accountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            overlay.classList.add('show');
            if (currentUser?.email === ADMIN_EMAIL) {
                showView('admin');
            } else if (currentUser) {
                showView('orders');
            } else {
                showView('auth');
            }
        });
    });

    closeBtn.onclick = () => overlay.classList.remove('show');
    adminExit.onclick = () => overlay.classList.remove('show');
    orderExit.onclick = () => overlay.classList.remove('show');
    
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('auth-title').textContent = tab.dataset.mode === 'login' ? 'Welcome Back' : 'Create Account';
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        const mode = overlay.querySelector('.auth-tab.active').dataset.mode;

        if (mode === 'signup') {
            if (allUsers.find(u => u.email === email)) {
                return showToast('User already exists!');
            }
            currentUser = { email, pass, active: true };
            allUsers.push(currentUser);
            localStorage.setItem('shoemall_all_users', JSON.stringify(allUsers));
            localStorage.setItem('shoemall_user', JSON.stringify(currentUser));
            showToast('Account initialized!');
        } else {
            const user = allUsers.find(u => u.email === email && u.pass === pass);
            if (user) {
                if (user.active === false && email !== ADMIN_EMAIL) {
                    return showToast('Your account has been deactivated by Admin.');
                }
                currentUser = user;
                localStorage.setItem('shoemall_user', JSON.stringify(currentUser));
                showToast(email === ADMIN_EMAIL ? 'Admin System Secure' : 'Welcome Back!');
            } else {
                return showToast('Invalid credentials.');
            }
        }
        
        updateUserUI();
        showView(email === ADMIN_EMAIL ? 'admin' : 'orders');
    });

    updateUserUI();
}

function showView(view) {
    document.getElementById('auth-main-view').style.display = view === 'auth' ? 'block' : 'none';
    document.getElementById('orders-view').style.display = view === 'orders' ? 'block' : 'none';
    document.getElementById('admin-view').style.display = view === 'admin' ? 'block' : 'none';
    
    if (view === 'orders') renderOrderHistory();
    if (view === 'admin') renderAdminDashboard();
}

// --- Admin Features ---
function renderAdminDashboard() {
    // Stats
    const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total.replace('$','')), 0);
    document.getElementById('admin-stat-revenue').textContent = `$${revenue.toFixed(2)}`;
    document.getElementById('admin-stat-users').textContent = allUsers.length;
    
    switchAdminTab('orders');
}

window.switchAdminTab = function(tab) {
    const btns = document.querySelectorAll('.admin-tab-btn');
    btns.forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(tab)));
    
    const content = document.getElementById('admin-content');
    if (tab === 'orders') {
        content.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td>#${o.id}</td>
                            <td>${o.user.split('@')[0]}</td>
                            <td>${o.total}</td>
                            <td><span style="color:green; font-weight:700;">PAID</span></td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align:center;">No runs found</td></tr>'}
                </tbody>
            </table>
        `;
    } else {
        content.innerHTML = `
            <div style="margin-bottom: 10px; text-align: right;">
                <button onclick="downloadCustomerList()" style="background: #28a745; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Export CSV</button>
            </div>
            <table class="admin-table">
                <thead>
                    <tr><th>Email</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${allUsers.map(u => `
                        <tr>
                            <td>${u.email} ${u.email === ADMIN_EMAIL ? '<span class="admin-badge">ADMIN</span>' : ''}</td>
                            <td><span style="color: ${u.active !== false ? 'green' : 'red'}; font-weight: 700;">${u.active !== false ? 'ACTIVE' : 'SUSPENDED'}</span></td>
                            <td>
                                ${u.email !== ADMIN_EMAIL ? `
                                    <button onclick="toggleUserStatus('${u.email}')" style="background: none; border: 1px solid ${u.active !== false ? 'red' : 'green'}; color: ${u.active !== false ? 'red' : 'green'}; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                                        ${u.active !== false ? 'Deactivate' : 'Activate'}
                                    </button>
                                ` : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
};

window.toggleUserStatus = function(email) {
    const user = allUsers.find(u => u.email === email);
    if (user && email !== ADMIN_EMAIL) {
        user.active = user.active !== false ? false : true;
        localStorage.setItem('shoemall_all_users', JSON.stringify(allUsers));
        switchAdminTab('customers');
        showToast(`User ${user.active ? 'Activated' : 'Suspended'}`);
    }
};

window.downloadCustomerList = function() {
    let csv = "Email,Role,Status\n";
    allUsers.forEach(u => {
        const role = u.email === ADMIN_EMAIL ? "Admin" : "Customer";
        const status = u.active !== false ? "Active" : "Suspended";
        csv += `${u.email},${role},${status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShoeMall_Customers_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
    a.click();
    showToast('Customer List Exported');
};

// --- User Profile Features ---
function renderOrderHistory() {
    const list = document.getElementById('orders-list');
    const userOrders = orders.filter(o => o.user === currentUser?.email);

    if (userOrders.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 0;">No history available.</p>';
        return;
    }

    list.innerHTML = userOrders.map(order => `
        <div class="order-item-card" style="border: 1px solid #eee; padding: 15px; border-radius: 12px; margin-bottom: 12px; background: #fff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 800; color: var(--primary-red); font-size: 0.9rem;">SMS-${order.id}</span>
                <span style="font-size: 0.75rem; color: #999;">${order.date}</span>
            </div>
            <div style="font-size: 0.85rem; color: #555; margin-bottom: 12px; line-height: 1.5;">
                ${order.items.map(i => `<div>• ${i.title} (x${i.quantity})</div>`).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f9f9f9; padding-top: 10px;">
                <span style="font-weight: 800; font-size: 1.1rem;">${order.total}</span>
                <button class="view-receipt-btn" style="background:none; border:none; color: #007bff; cursor: pointer; font-size: 0.8rem; font-weight: 700; text-decoration: underline;" onclick="reDownload('${order.id}')">Download</button>
            </div>
        </div>
    `).join('');
}

window.reDownload = function(id) {
    const o = orders.find(o => o.id === id);
    if (o) downloadReceipt(o.id, o.total, o.items);
};

function logout() {
    currentUser = null;
    localStorage.removeItem('shoemall_user');
    updateUserUI();
    showToast('Safe Exit');
    document.getElementById('auth-modal-overlay').classList.remove('show');
}

function updateUserUI() {
    const accountBtn = document.querySelector('.header-actions .action-item:first-child');
    if (!accountBtn) return;

    if (currentUser) {
        const isAdmin = currentUser.email === ADMIN_EMAIL;
        accountBtn.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <i class="fas ${isAdmin ? 'fa-user-shield' : 'fa-user-circle'}" style="color: ${isAdmin ? '#000' : 'var(--primary-red)'}; font-size: 1.2rem;"></i>
                <span style="font-size: 0.8rem; font-weight: 800;">${isAdmin ? 'ADMIN' : currentUser.email.split('@')[0]}</span>
                <small class="logout-link" style="font-size: 8px; color: #999; text-decoration: underline;">Logout</small>
            </div>
        `;
        accountBtn.querySelector('.logout-link').onclick = (e) => { e.stopPropagation(); logout(); };
    } else {
        accountBtn.innerHTML = `<i class="far fa-user"></i> <span>Account</span>`;
    }
}

// --- Cart Core Logic ---
function updateCartCount() {
    const counts = document.querySelectorAll('.cart-count');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    counts.forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? 'block' : 'none';
    });
}

function initAddToCart() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    grid.onclick = (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;

        const card = btn.closest('.product-card');
        const product = {
            id: card.dataset.id,
            title: card.querySelector('.product-title').textContent,
            price: card.querySelector('.current-price').textContent,
            image: card.querySelector('img').src,
            quantity: 1
        };

        const existing = cart.find(i => i.id === product.id);
        if (existing) existing.quantity++;
        else cart.push(product);

        saveCart();
        showToast('Cart Updated');
    };
}

function saveCart() {
    localStorage.setItem('shoemall_cart', JSON.stringify(cart));
    updateCartCount();
}

// --- Cart Interface ---
function initCartDrawer() {
    if (!document.getElementById('cart-drawer')) {
        const html = `
            <div class="cart-drawer-overlay" id="drawer-overlay"></div>
            <div id="cart-drawer">
                <div class="drawer-header"><h3>Shopping Bag</h3><button class="close-drawer">&times;</button></div>
                <div class="cart-items-list"></div>
                <div class="drawer-footer">
                    <div class="cart-total"><span>Due:</span><span id="drawer-total-price">$0.00</span></div>
                    <button class="checkout-btn">Finalize Order</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const close = drawer.querySelector('.close-drawer');

    const toggle = () => {
        drawer.classList.toggle('show');
        overlay.classList.toggle('show');
        if (drawer.classList.contains('show')) renderCartItems();
    };

    document.querySelectorAll('.cart-icon').forEach(i => i.onclick = (e) => { e.preventDefault(); toggle(); });
    close.onclick = toggle;
    overlay.onclick = toggle;

    drawer.querySelector('.checkout-btn').onclick = () => {
        if (!currentUser) {
            showToast('Login Required');
            document.getElementById('auth-modal-overlay').classList.add('show');
            showView('auth');
            return;
        }
        if (cart.length === 0) return;

        const total = document.getElementById('drawer-total-price').textContent;
        const prompt = `PAYMENT SYSTEM\n--------------\nTotal: ${total}\n\nM-Pesa Paybill: 7382528\nAccount: ${currentUser.email.split('@')[0]}\n\nAuthorize once paid.`;

        if (confirm(prompt)) {
            const orderID = Math.floor(10000 + Math.random() * 90000);
            const newOrder = {
                id: orderID.toString(),
                date: new Date().toLocaleString(),
                user: currentUser.email,
                total: total,
                items: [...cart]
            };

            orders.unshift(newOrder);
            localStorage.setItem('shoemall_orders', JSON.stringify(orders));
            
            downloadReceipt(newOrder.id, total, cart);
            showToast('Order Recorded');
            
            cart = [];
            saveCart();
            renderCartItems();
            setTimeout(toggle, 1000);
        }
    };

    drawer.querySelector('.cart-items-list').onclick = (e) => {
        const id = e.target.dataset.id;
        const item = cart.find(i => i.id === id);
        if (!item) return;

        if (e.target.classList.contains('plus-qty')) item.quantity++;
        else if (e.target.classList.contains('minus-qty')) item.quantity--;
        else if (e.target.classList.contains('remove-item')) cart = cart.filter(i => i.id !== id);

        if (item && item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCartItems();
    };
}

function renderCartItems() {
    const list = document.querySelector('.cart-items-list');
    const totalEl = document.getElementById('drawer-total-price');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:100px 0; color:#999;">Bag is empty</div>';
        totalEl.textContent = '$0.00';
        return;
    }

    let sum = 0;
    list.innerHTML = cart.map(item => {
        const p = parseFloat(item.price.replace('$', ''));
        sum += p * item.quantity;
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
    totalEl.textContent = `$${sum.toFixed(2)}`;
}

// --- Systems ---
function downloadReceipt(id, total, items) {
    const raw = `SHOEMALL OFFICIAL RECEIPT\nORDER #${id}\n------------------\n${items.map(i => `${i.title} x${i.quantity}`).join('\n')}\n------------------\nTOTAL: ${total}\nPAYBILL: 7382528\nThank you!`;
    const blob = new Blob([raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Receipt_${id}.txt`; a.click();
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
    const run = () => {
        const q = input.value.toLowerCase().trim();
        if (!document.querySelector('.product-grid')) { window.location.href = `index.html?search=${encodeURIComponent(q)}`; return; }
        document.querySelectorAll('.product-card').forEach(c => {
            c.style.display = c.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
        });
    };
    if (btn) btn.onclick = run;
    if (input) input.onkeyup = (e) => { if (e.key === 'Enter') run(); };
    const p = new URLSearchParams(window.location.search);
    if (p.get('search')) { input.value = p.get('search'); setTimeout(run, 100); }
}

function showToast(m) {
    const t = document.createElement('div'); t.className = 'cart-toast';
    t.innerHTML = `<i class="fas fa-check-circle"></i> ${m}`; document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 100);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 2000);
}
