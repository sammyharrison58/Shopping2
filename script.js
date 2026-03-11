
// State Management
let cart = JSON.parse(localStorage.getItem('shoemall_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('shoemall_user')) || null;

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initFilter();
    initSearch();
    initAddToCart();
    initCartDrawer();
    initAuth();
});

// --- Authentication Logic ---
function initAuth() {
    // Inject Auth Modal if not present
    if (!document.getElementById('auth-modal-overlay')) {
        const authHTML = `
            <div class="modal-overlay" id="auth-modal-overlay">
                <div class="auth-modal">
                    <button class="close-modal">&times;</button>
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
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', authHTML);
    }

    const overlay = document.getElementById('auth-modal-overlay');
    const closeBtn = overlay.querySelector('.close-modal');
    const tabs = overlay.querySelectorAll('.auth-tab');
    const form = document.getElementById('auth-form');
    let currentMode = 'login';

    // Account Button Click
    const accountBtns = document.querySelectorAll('.action-item:first-child'); // First item is Account
    accountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                // User already logged in, maybe show profile or just toggle logout
                if (confirm(`Logged in as ${currentUser.email}. Log out?`)) {
                    logout();
                }
            } else {
                overlay.classList.add('show');
            }
        });
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('show');
    });

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
            // Simulated Signup
            currentUser = { email, pass };
            localStorage.setItem('shoemall_user', JSON.stringify(currentUser));
            showToast('Account created successfully!');
        } else {
            // Simulated Login
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
        overlay.classList.remove('show');
    });

    updateUserUI();
}

function logout() {
    currentUser = null;
    updateUserUI();
    showToast('Logged out.');
}

function updateUserUI() {
    const accountBtn = document.querySelector('.header-actions .action-item:first-child');
    if (!accountBtn) return;

    if (currentUser) {
        accountBtn.innerHTML = `
            <i class="fas fa-user-check" style="color: var(--primary-red);"></i>
            <span>${currentUser.email.split('@')[0]}</span>
            <small class="logout-btn">Logout</small>
        `;
        const logoutBtn = accountBtn.querySelector('.logout-btn');
        logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            logout();
        });
    } else {
        accountBtn.innerHTML = `
            <i class="far fa-user"></i>
            <span>Account</span>
        `;
    }
}

// --- Cart Logic ---
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

        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('.product-card');
        const product = {
            id: card.dataset.id || Math.random().toString(36).substr(2, 9),
            title: card.querySelector('.product-title').textContent,
            price: card.querySelector('.current-price').textContent,
            image: card.querySelector('img').src,
            quantity: 1
        };

        addToCart(product);
        showToast(`Added ${product.title} to cart!`);
    });
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(product);
    }
    saveCart();
    renderCartItems();
}

function saveCart() {
    localStorage.setItem('shoemall_cart', JSON.stringify(cart));
    updateCartCount();
}

// --- Cart Drawer Logic ---
function initCartDrawer() {
    if (!document.getElementById('cart-drawer')) {
        const drawerHTML = `
            <div class="cart-drawer-overlay" id="drawer-overlay"></div>
            <div id="cart-drawer">
                <div class="drawer-header">
                    <h3>Your Shopping Cart</h3>
                    <button class="close-drawer">&times;</button>
                </div>
                <div class="cart-items-list"></div>
                <div class="drawer-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span id="drawer-total-price">$0.00</span>
                    </div>
                    <button class="checkout-btn">Proceed to Checkout</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', drawerHTML);
    }

    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = drawer.querySelector('.close-drawer');
    const cartIcons = document.querySelectorAll('.cart-icon');

    const toggleDrawer = () => {
        drawer.classList.toggle('show');
        overlay.classList.toggle('show');
        if (drawer.classList.contains('show')) renderCartItems();
    };

    cartIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDrawer();
        });
    });

    closeBtn.addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', toggleDrawer);

    drawer.querySelector('.checkout-btn').addEventListener('click', () => {
        if (!currentUser) {
            showToast('Please login to checkout!');
            document.getElementById('auth-modal-overlay').classList.add('show');
            return;
        }
        if (cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }
        alert('Thank you for choosing ShoeMall! This is where the checkout process would begin.');
    });

    drawer.querySelector('.cart-items-list').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('plus-qty')) {
            updateItemQty(id, 1);
        } else if (e.target.classList.contains('minus-qty')) {
            updateItemQty(id, -1);
        } else if (e.target.classList.contains('remove-item')) {
            removeFromCart(id);
        }
    });

    renderCartItems();
}

function renderCartItems() {
    const list = document.querySelector('.cart-items-list');
    const totalEl = document.getElementById('drawer-total-price');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align: center; margin-top: 50px; color: #999;">Your cart is empty.</p>';
        totalEl.textContent = '$0.00';
        return;
    }

    let total = 0;
    list.innerHTML = cart.map(item => {
        const priceValue = parseFloat(item.price.replace('$', ''));
        total += priceValue * item.quantity;

        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
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

    totalEl.textContent = `$${total.toFixed(2)}`;
}

function updateItemQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCartItems();
        }
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCartItems();
}

// --- Filter Logic ---
function initFilter() {
    const sideNavLinks = document.querySelectorAll('.side-nav a');
    const productCards = document.querySelectorAll('.product-card');

    sideNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sideNavLinks.forEach(l => l.classList.remove('active-filter'));
            link.classList.add('active-filter');
            const category = link.textContent.trim().toLowerCase();
            productCards.forEach(card => {
                const cardCategory = card.dataset.category?.toLowerCase() || '';
                if (category === 'all categories' || category === 'new arrivals' || cardCategory.includes(category) || category.includes(cardCategory)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// --- Search Logic ---
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-btn');
    const productCards = document.querySelectorAll('.product-card');
    const isIndex = !!document.querySelector('.product-grid');

    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!isIndex) {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            return;
        }
        let found = 0;
        productCards.forEach(card => {
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const category = card.dataset.category?.toLowerCase() || '';
            if (title.includes(query) || category.includes(query)) {
                card.style.display = 'flex';
                found++;
            } else {
                card.style.display = 'none';
            }
        });
        if (found === 0 && query !== '') showToast('No products match your search.');
    };

    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam && isIndex && searchInput) {
        searchInput.value = searchParam;
        setTimeout(handleSearch, 100);
    }

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
            else if (searchInput.value === '' && isIndex) handleSearch(); 
        });
    }
}

// --- UI Helpers ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
