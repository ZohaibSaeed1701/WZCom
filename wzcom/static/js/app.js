// Global Application State Caches
let currentUser = null;
let chartsCache = {};
let activeFilters = {
    region: '',
    category: '',
    segment: '',
    payment: '',
    date_from: '',
    date_to: ''
};

let explorerFilters = {
    search: '',
    sort_by: 'order_date',
    sort_order: 'desc',
    page: 1,
    per_page: 10
};

// Document Load Listener
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// App Initialization
function initApp() {
    setupThemeToggler();
    setupNavigation();
    setupFilters();
    setupAuthListeners();
    setupCRUDListeners();
    checkAuthSession();

    // Default Load Page Data
    refreshAllData();
}



// 1b. Dark/Light Theme Toggler Setup
function setupThemeToggler() {
    const toggleBtn = document.getElementById("themeToggleBtn");
    if (!toggleBtn) return;

    const toggleTheme = () => {
        const isLight = document.body.classList.toggle("light-theme");
        localStorage.setItem("theme", isLight ? "light" : "dark");
        updateThemeUI(isLight);
        // Refresh charts to apply new theme colors
        fetchCharts();
    };

    toggleBtn.addEventListener("click", toggleTheme);

    // Initial load check
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        updateThemeUI(true);
    } else {
        document.body.classList.remove("light-theme");
        updateThemeUI(false);
    }
}

function updateThemeUI(isLight) {
    const toggleIcon = document.querySelector("#themeToggleBtn i");
    if (toggleIcon) {
        toggleIcon.className = isLight ? "fa-solid fa-moon" : "fa-solid fa-sun";
    }
}

// 2. Navigation Sidebar Routing (Single Page App Layout)
function setupNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");
    const viewPanes = document.querySelectorAll(".view-pane");
    const viewTitle = document.getElementById("viewTitle");
    const viewSubtitle = document.getElementById("viewSubtitle");

    const headerLoginBtn = document.getElementById("headerLoginBtn");

    headerLoginBtn.addEventListener("click", () => {
        switchTab("profile");
    });

    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetView = item.getAttribute("data-view");
            switchTab(targetView);
        });
    });
}

function switchTab(viewId) {
    const menuItems = document.querySelectorAll(".menu-item");
    const viewPanes = document.querySelectorAll(".view-pane");
    const viewTitle = document.getElementById("viewTitle");
    const viewSubtitle = document.getElementById("viewSubtitle");

    // Remove active class from all
    menuItems.forEach(i => i.classList.remove("active"));
    viewPanes.forEach(pane => pane.style.display = "none");

    // Add active to selected
    const activeItem = document.querySelector(`.menu-item[data-view="${viewId}"]`);
    if (activeItem) activeItem.classList.add("active");

    const targetPane = document.getElementById(`view-${viewId}`);
    if (targetPane) targetPane.style.display = "flex";

    // Set page text descriptors
    switch (viewId) {
        case "dashboard":
            viewTitle.innerText = "Dashboard Overview";
            viewSubtitle.innerText = "High-level sales and profit statistics";
            break;
        case "charts":
            viewTitle.innerText = "Visual Analysis & Trends";
            viewSubtitle.innerText = "Interactive multidimensional charts & data visual plots";
            break;
        case "explorer":
            viewTitle.innerText = "Data Explorer Manager";
            viewSubtitle.innerText = "Review and edit transactions in the SQLite database";
            break;
        case "profile":
            viewTitle.innerText = "User Account Management";
            viewSubtitle.innerText = "Access permissions and authentication";
            break;
    }
}

// 3. API Filters Event Listeners
function setupFilters() {
    const inputs = [
        "filterRegion", "filterCategory", "filterSegment", "filterPayment",
        "filterDateFrom", "filterDateTo"
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener("change", () => {
            // Update filter state
            const key = id.replace("filter", "").toLowerCase();
            activeFilters[key == 'datefrom' ? 'date_from' : key == 'dateto' ? 'date_to' : key] = el.value;
            explorerFilters.page = 1; // Reset database explorer page count
            refreshAllData();
        });
    });

    // Reset Filters Button
    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
        inputs.forEach(id => {
            document.getElementById(id).value = "";
        });
        activeFilters.region = '';
        activeFilters.category = '';
        activeFilters.segment = '';
        activeFilters.payment = '';
        activeFilters.date_from = '';
        activeFilters.date_to = '';
        explorerFilters.page = 1;
        refreshAllData();
        showToast("Filters reset successfully!", "success");
    });
}

// Refresh Data Core Handler
function refreshAllData() {
    fetchStats();
    fetchInsights();
    fetchCharts();
    fetchOrders();
}

// Helper to construct Query String parameters for Dashboard/Charts
function getQueryString() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(activeFilters)) {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    }
    return params.toString();
}

// Helper to construct Query String parameters for Database Explorer
function getExplorerQueryString() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(explorerFilters)) {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    }
    return params.toString();
}

// 4. API Data Fetch Services

// A. KPI Stats API
async function fetchStats() {
    try {
        const res = await fetch(`/api/analytics/stats?${getQueryString()}`);
        if (!res.ok) throw new Error("Stats fetch error");
        const data = await res.json();

        // Populate KPIs
        animateCounter("kpiSales", data.total_sales, true);
        animateCounter("kpiProfit", data.total_profit, true);
        animateCounter("kpiOrders", data.orders_count, false);
        animateCounter("kpiDiscount", data.avg_discount, false, "%");
    } catch (e) {
        console.error(e);
    }
}

// Helper counter animator
function animateCounter(elementId, targetValue, isCurrency, suffix = '') {
    const el = document.getElementById(elementId);
    let start = 0;
    const duration = 800; // ms
    const stepTime = 16; // ms (~60fps)
    const steps = duration / stepTime;
    const increment = targetValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
        start += increment;
        currentStep++;

        let displayVal = Math.round(start * 100) / 100;
        if (isCurrency) {
            el.innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayVal);
        } else {
            el.innerText = displayVal.toLocaleString() + suffix;
        }

        if (currentStep >= steps) {
            clearInterval(timer);
            if (isCurrency) {
                el.innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(targetValue);
            } else {
                el.innerText = targetValue.toLocaleString() + suffix;
            }
        }
    }, stepTime);
}

// B. AI Insights API
async function fetchInsights() {
    const list = document.getElementById("insightsList");
    list.innerHTML = `<li><i class="fa-solid fa-spinner fa-spin"></i> Calculating automated insights...</li>`;
    try {
        const res = await fetch(`/api/analytics/insights?${getQueryString()}`);
        if (!res.ok) throw new Error("Insights fetch error");
        const data = await res.json();

        list.innerHTML = "";
        if (data.insights.length === 0) {
            list.innerHTML = "<li>No insights generated for current filters.</li>";
            return;
        }

        data.insights.forEach(insight => {
            // Replace markdown bold tags ** with HTML <strong>
            let formatted = insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Replace markdown italics tags * with HTML <em>
            formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
            list.innerHTML += `<li>${formatted}</li>`;
        });
    } catch (e) {
        list.innerHTML = `<li class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error loading insights.</li>`;
    }
}

// C. Charts API & Chart.js Rendering
async function fetchCharts() {
    try {
        const res = await fetch(`/api/analytics/charts?${getQueryString()}`);
        if (!res.ok) throw new Error("Charts data error");
        const data = await res.json();

        const isLight = document.body.classList.contains("light-theme");
        const textColor = isLight ? '#475569' : '#a0aec0';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

        // Destroy previous charts before drawing new ones to prevent overlapping
        destroyChart("barChart");
        destroyChart("pieChart");
        destroyChart("lineChart");
        destroyChart("histogramChart");
        destroyChart("scatterChart");

        // 1. Line Chart: Monthly Trend
        const ctxLine = document.getElementById("lineChart").getContext("2d");
        chartsCache["lineChart"] = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: data.line.labels,
                datasets: [
                    {
                        label: 'Total Sales ($)',
                        data: data.line.sales,
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 3
                    },
                    {
                        label: 'Net Profit ($)',
                        data: data.line.profit,
                        borderColor: '#00f2fe',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 3
                    }
                ]
            },
            options: getChartOptions()
        });

        // 2. Bar Chart: Category sales & profit
        const ctxBar = document.getElementById("barChart").getContext("2d");
        chartsCache["barChart"] = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: data.bar.labels,
                datasets: [
                    {
                        label: 'Sales ($)',
                        data: data.bar.sales,
                        backgroundColor: '#8e2de2',
                        borderRadius: 6
                    },
                    {
                        label: 'Profit ($)',
                        data: data.bar.profit,
                        backgroundColor: '#00f2fe',
                        borderRadius: 6
                    }
                ]
            },
            options: getChartOptions()
        });

        // 3. Pie Chart: Segment Share
        const ctxPie = document.getElementById("pieChart").getContext("2d");
        chartsCache["pieChart"] = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: data.pie.labels,
                datasets: [{
                    data: data.pie.values,
                    backgroundColor: ['#8e2de2', '#4facfe', '#f093fb'],
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#a0aec0', font: { family: 'Outfit' } }
                    }
                }
            }
        });

        // 4. Histogram: Discount Frequency
        const ctxHist = document.getElementById("histogramChart").getContext("2d");
        chartsCache["histogramChart"] = new Chart(ctxHist, {
            type: 'bar',
            data: {
                labels: data.histogram.labels,
                datasets: [{
                    label: 'Number of Orders',
                    data: data.histogram.values,
                    backgroundColor: 'rgba(0, 242, 254, 0.75)',
                    borderColor: '#00f2fe',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: getChartOptions(false)
        });

        // 5. Scatter Plot: Quantity vs. Sales
        const ctxScatter = document.getElementById("scatterChart").getContext("2d");
        chartsCache["scatterChart"] = new Chart(ctxScatter, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Transactions',
                    data: data.scatter,
                    backgroundColor: 'rgba(142, 45, 226, 0.6)',
                    borderColor: '#8e2de2',
                    pointRadius: 6,
                    pointHoverRadius: 9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const pt = context.raw;
                                return `Qty: ${pt.x} | Sales: $${pt.y.toFixed(2)} | Profit: $${pt.profit.toFixed(2)} (${pt.product})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Order Quantity', color: textColor, font: { family: 'Plus Jakarta Sans' } },
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
                    },
                    y: {
                        title: { display: true, text: 'Total Sales ($)', color: textColor, font: { family: 'Plus Jakarta Sans' } },
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
                    }
                }
            }
        });

    } catch (e) {
        console.error(e);
    }
}

// Chart options template generator
function getChartOptions(showLegend = true) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showLegend,
                position: 'top',
                labels: { color: '#a0aec0', font: { family: 'Outfit', size: 12 } }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#a0aec0', font: { family: 'Outfit' } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#a0aec0', font: { family: 'Outfit' } }
            }
        }
    };
}

function destroyChart(chartId) {
    if (chartsCache[chartId]) {
        chartsCache[chartId].destroy();
        delete chartsCache[chartId];
    }
}

// D. Data Table API (Orders Explorer)
async function fetchOrders() {
    const tableBody = document.getElementById("explorerTableBody");
    const topOrdersBody = document.getElementById("topOrdersTableBody");
    tableBody.innerHTML = `<tr><td colspan="11" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Loading records...</td></tr>`;

    try {
        const res = await fetch(`/api/orders?${getExplorerQueryString()}`);
        if (!res.ok) throw new Error("Orders error");
        const data = await res.json();

        // 1. Populate Explorer Table
        tableBody.innerHTML = "";
        if (data.orders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="11" class="text-center text-muted">No transactions found matching the query.</td></tr>`;
        } else {
            data.orders.forEach(o => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${o.order_id}</strong></td>
                    <td class="text-muted">${o.order_date}</td>
                    <td>${o.customer_name}</td>
                    <td><span class="user-status">${o.customer_segment}</span></td>
                    <td>${o.region}</td>
                    <td>${o.product_category}</td>
                    <td class="text-muted text-truncate" style="max-width: 140px;" title="${o.product_name}">${o.product_name}</td>
                    <td>${o.quantity}</td>
                    <td><strong>$${o.total_sales.toFixed(2)}</strong></td>
                    <td class="${o.profit >= 0 ? 'text-success' : 'text-danger'}"><strong>$${o.profit.toFixed(2)}</strong></td>
                    <td>
                        <button class="action-icon-btn edit" onclick="openEditOrderModal(${o.id}, '${o.order_id}', '${o.order_date}', '${o.customer_name.replace(/'/g, "\\'")}', '${o.customer_segment}', '${o.country.replace(/'/g, "\\'")}', '${o.region}', '${o.product_category}', '${o.product_name.replace(/'/g, "\\'")}', ${o.quantity}, ${o.unit_price}, ${o.discount_percent}, ${o.shipping_cost}, '${o.payment_method}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-icon-btn delete" onclick="deleteOrder(${o.id})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // 2. Pagination updates
        const startEntry = (data.page - 1) * data.per_page + 1;
        const endEntry = Math.min(startEntry + data.orders.length - 1, data.total_count);
        document.getElementById("tablePaginationInfo").innerText =
            data.total_count > 0 ? `Showing ${startEntry} to ${endEntry} of ${data.total_count} entries` : 'Showing 0 to 0 of 0 entries';

        document.getElementById("pageNumberDisplay").innerText = `Page ${data.page} of ${data.total_pages}`;

        // Enable/Disable buttons
        document.getElementById("prevPageBtn").disabled = (data.page <= 1);
        document.getElementById("nextPageBtn").disabled = (data.page >= data.total_pages);

        // 3. Populate Top 10 High Value Orders inside Dashboard View (If on dashboard)
        if (data.page === 1) {
            topOrdersBody.innerHTML = "";
            // We can sort them on frontend or fetch a custom API, but since pagination returns top orders on page 1 sorted by sales desc, let's use the first 10
            const sortedBySales = [...data.orders].sort((a, b) => b.total_sales - a.total_sales).slice(0, 10);
            if (sortedBySales.length === 0) {
                topOrdersBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No orders available.</td></tr>`;
            } else {
                sortedBySales.forEach(o => {
                    topOrdersBody.innerHTML += `
                        <tr>
                            <td><strong>${o.order_id}</strong></td>
                            <td class="text-truncate" style="max-width: 110px;">${o.customer_name}</td>
                            <td><strong>$${o.total_sales.toFixed(2)}</strong></td>
                            <td class="${o.profit >= 0 ? 'text-success' : 'text-danger'}"><strong>$${o.profit.toFixed(2)}</strong></td>
                        </tr>
                    `;
                });
            }
        }

    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="11" class="text-center text-danger">Error fetching records.</td></tr>`;
    }
}

// 5. User Authentication APIs & Event Listeners
function setupAuthListeners() {
    const tabLogin = document.getElementById("tabLoginBtn");
    const tabReg = document.getElementById("tabRegisterBtn");
    const formLogin = document.getElementById("loginForm");
    const formReg = document.getElementById("registerForm");

    // Form tab toggling
    tabLogin.addEventListener("click", () => {
        tabReg.classList.remove("active");
        tabLogin.classList.add("active");
        formReg.style.display = "none";
        formLogin.style.display = "flex";
    });

    tabReg.addEventListener("click", () => {
        tabLogin.classList.remove("active");
        tabReg.classList.add("active");
        formLogin.style.display = "none";
        formReg.style.display = "flex";
    });

    // Login Form Submit
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const errEl = document.getElementById("loginErrorMsg");
        errEl.innerText = "";

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById("loginUsername").value,
                    password: document.getElementById("loginPassword").value
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            setUserState(data.user);
            showToast("Successfully signed in!", "success");
            switchTab("dashboard");
        } catch (err) {
            errEl.innerText = err.message;
        }
    });

    // Register Form Submit
    formReg.addEventListener("submit", async (e) => {
        e.preventDefault();
        const errEl = document.getElementById("registerErrorMsg");
        errEl.innerText = "";

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById("registerUsername").value,
                    email: document.getElementById("registerEmail").value,
                    password: document.getElementById("registerPassword").value
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");

            setUserState(data.user);
            showToast("Account created successfully!", "success");
            switchTab("dashboard");
        } catch (err) {
            errEl.innerText = err.message;
        }
    });

    // Logout actions
    const logoutAction = async () => {
        await fetch('/api/auth/logout');
        setUserState(null);
        showToast("Signed out successfully.", "success");
        switchTab("dashboard");
    };

    document.getElementById("profileLogoutBtn").addEventListener("click", logoutAction);
    document.getElementById("sidebarLogout").addEventListener("click", logoutAction);
}

// Manage authentication badges and display permissions
function checkAuthSession() {
    fetch('/api/auth/profile')
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("No session");
        })
        .then(data => {
            if (data.authenticated) {
                setUserState(data.user);
            }
        })
        .catch(() => setUserState(null));
}

function setUserState(user) {
    currentUser = user;
    const badgeName = document.getElementById("badgeUsername");
    const badgeStatus = document.getElementById("badgeStatus");
    const sidebarLogout = document.getElementById("sidebarLogout");
    const headerLoginBtn = document.getElementById("headerLoginBtn");

    const authBox = document.getElementById("authFormsContainer");
    const profileBox = document.getElementById("profileDetailsContainer");

    if (user) {
        badgeName.innerText = user.username;
        badgeStatus.innerText = "Admin Operator";
        sidebarLogout.style.display = "flex";
        headerLoginBtn.style.display = "none";

        // Profile view update
        document.getElementById("profileUsername").innerText = user.username;
        authBox.style.display = "none";
        profileBox.style.display = "block";
    } else {
        badgeName.innerText = "Guest User";
        badgeStatus.innerText = "View Only Mode";
        sidebarLogout.style.display = "none";
        headerLoginBtn.style.display = "flex";

        // Profile view update
        authBox.style.display = "block";
        profileBox.style.display = "none";
    }
}

// 6. Dataset CRUD Listeners & Modal Controls
function setupCRUDListeners() {
    const modal = document.getElementById("orderModal");
    const addBtn = document.getElementById("addOrderBtn");
    const closeBtn = document.getElementById("closeOrderModalBtn");
    const cancelBtn = document.getElementById("cancelOrderModalBtn");
    const orderForm = document.getElementById("orderForm");

    // Modal opens (Add Mode)
    addBtn.addEventListener("click", () => {
        if (!currentUser) {
            showToast("Please login first to modify the database.", "danger");
            switchTab("profile");
            return;
        }
        document.getElementById("modalTitle").innerText = "Add New Transaction Record";
        document.getElementById("editRecordId").value = "";
        orderForm.reset();

        // Set a random unique order ID default
        const randomId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
        document.getElementById("modalOrderId").value = randomId;
        document.getElementById("modalOrderId").disabled = false;

        // Set today's date default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById("modalOrderDate").value = today;

        triggerRecalculation();
        modal.style.display = "flex";
    });

    // Close Modal triggers
    const closeModal = () => { modal.style.display = "none"; };
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    // Dynamic calculations update triggers
    const inputsToRecalc = ["modalQuantity", "modalUnitPrice", "modalDiscountPercent", "modalShippingCost"];
    inputsToRecalc.forEach(id => {
        document.getElementById(id).addEventListener("input", triggerRecalculation);
        document.getElementById(id).addEventListener("change", triggerRecalculation);
    });

    // Submit form (Create or Update)
    orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const errEl = document.getElementById("modalErrorMsg");
        errEl.innerText = "";

        const recordId = document.getElementById("editRecordId").value;
        const payload = {
            order_id: document.getElementById("modalOrderId").value,
            order_date: document.getElementById("modalOrderDate").value,
            customer_name: document.getElementById("modalCustomerName").value,
            customer_segment: document.getElementById("modalCustomerSegment").value,
            country: document.getElementById("modalCountry").value,
            region: document.getElementById("modalRegion").value,
            product_category: document.getElementById("modalProductCategory").value,
            product_name: document.getElementById("modalProductName").value,
            quantity: parseInt(document.getElementById("modalQuantity").value),
            unit_price: parseFloat(document.getElementById("modalUnitPrice").value),
            discount_percent: parseInt(document.getElementById("modalDiscountPercent").value),
            shipping_cost: parseFloat(document.getElementById("modalShippingCost").value),
            payment_method: document.getElementById("modalPaymentMethod").value
        };

        const isEdit = recordId !== "";
        const url = isEdit ? `/api/orders/${recordId}` : `/api/orders`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save error");

            showToast(isEdit ? "Transaction updated successfully!" : "Transaction record added!", "success");
            closeModal();
            refreshAllData();
        } catch (err) {
            errEl.innerText = err.message;
        }
    });

    // Export CSV and Print Report buttons
    document.getElementById("exportCsvBtn").addEventListener("click", () => {
        window.location.href = `/api/export/csv?${getExplorerQueryString()}`;
    });

    document.getElementById("printReportBtn").addEventListener("click", () => {
        window.print();
    });

    // Pagination events
    document.getElementById("prevPageBtn").addEventListener("click", () => {
        if (explorerFilters.page > 1) {
            explorerFilters.page--;
            fetchOrders();
        }
    });

    document.getElementById("nextPageBtn").addEventListener("click", () => {
        explorerFilters.page++;
        fetchOrders();
    });

    // Entries per page change
    document.getElementById("perPageSelector").addEventListener("change", (e) => {
        explorerFilters.per_page = parseInt(e.target.value);
        explorerFilters.page = 1;
        fetchOrders();
    });

    // Sort order column selection
    document.getElementById("sortSelector").addEventListener("change", (e) => {
        explorerFilters.sort_by = e.target.value;
        explorerFilters.page = 1;
        fetchOrders();
    });

    // Sort order Direction toggle
    const orderBtn = document.getElementById("sortOrderToggle");
    orderBtn.addEventListener("click", () => {
        const current = orderBtn.getAttribute("data-order");
        if (current === 'desc') {
            orderBtn.setAttribute("data-order", "asc");
            orderBtn.innerHTML = `<i class="fa-solid fa-sort-up"></i> Asc`;
            explorerFilters.sort_order = 'asc';
        } else {
            orderBtn.setAttribute("data-order", "desc");
            orderBtn.innerHTML = `<i class="fa-solid fa-sort-down"></i> Desc`;
            explorerFilters.sort_order = 'desc';
        }
        explorerFilters.page = 1;
        fetchOrders();
    });

    // Search query with debounce
    let searchTimeout;
    document.getElementById("explorerSearch").addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            explorerFilters.search = e.target.value;
            explorerFilters.page = 1;
            fetchOrders();
        }, 300);
    });
}

// Trigger live recalculation inside Add/Edit Modal
function triggerRecalculation() {
    const qty = parseInt(document.getElementById("modalQuantity").value) || 0;
    const price = parseFloat(document.getElementById("modalUnitPrice").value) || 0;
    const disc = parseInt(document.getElementById("modalDiscountPercent").value) || 0;
    const shipping = parseFloat(document.getElementById("modalShippingCost").value) || 0;

    const sales = qty * price * (1 - disc / 100.0);
    const cost = qty * price * 0.60;
    const profit = sales - shipping - cost;

    document.getElementById("recalcSalesValue").innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sales);
    document.getElementById("recalcProfitValue").innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profit);

    const profitEl = document.getElementById("recalcProfitValue");
    if (profit >= 0) {
        profitEl.className = "text-success";
    } else {
        profitEl.className = "text-danger";
    }
}

// Modal opens (Edit Mode) - Global reference called from inline onclick attributes
window.openEditOrderModal = function (id, orderId, date, customer, segment, country, region, category, product, qty, price, disc, shipping, payment) {
    if (!currentUser) {
        showToast("Please login first to modify the database.", "danger");
        switchTab("profile");
        return;
    }
    document.getElementById("modalTitle").innerText = "Edit Transaction Record";
    document.getElementById("editRecordId").value = id;

    document.getElementById("modalOrderId").value = orderId;
    document.getElementById("modalOrderId").disabled = true; // Cannot modify primary ID
    document.getElementById("modalOrderDate").value = date;
    document.getElementById("modalCustomerName").value = customer;
    document.getElementById("modalCustomerSegment").value = segment;
    document.getElementById("modalCountry").value = country;
    document.getElementById("modalRegion").value = region;
    document.getElementById("modalProductCategory").value = category;
    document.getElementById("modalProductName").value = product;
    document.getElementById("modalQuantity").value = qty;
    document.getElementById("modalUnitPrice").value = price;
    document.getElementById("modalDiscountPercent").value = disc;
    document.getElementById("modalShippingCost").value = shipping;
    document.getElementById("modalPaymentMethod").value = payment;

    triggerRecalculation();
    document.getElementById("orderModal").style.display = "flex";
};

// Delete record handler
window.deleteOrder = async function (id) {
    if (!currentUser) {
        showToast("Please login first to modify the database.", "danger");
        switchTab("profile");
        return;
    }
    if (confirm("Are you sure you want to permanently delete this transaction record?")) {
        try {
            const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");

            showToast("Record deleted successfully.", "success");
            refreshAllData();
        } catch (e) {
            showToast(e.message, "danger");
        }
    }
};

// 7. Toast Alerts System
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let iconClass = "fa-circle-check";
    if (type === "danger") iconClass = "fa-circle-xmark";

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 3500);
}
