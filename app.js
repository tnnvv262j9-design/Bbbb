// Datos y Estado
let transactions = [];
let budgets = {};
let currentCurrency = 'USD';

// Configuración global de Chart.js para modo oscuro
Chart.defaults.color = '#B3B3B3';
Chart.defaults.borderColor = '#282828';

// Elementos del DOM
const navItems = document.querySelectorAll('#nav-menu li');
const views = document.querySelectorAll('.view');
const pageTitle = document.getElementById('page-title');

const totalBalanceEl = document.getElementById('total-balance');
const totalIncomesEl = document.getElementById('total-incomes');
const fixedIncomesEl = document.getElementById('fixed-incomes');
const totalPaymentsEl = document.getElementById('total-payments');
const fixedPaymentsEl = document.getElementById('fixed-payments');

const formIngreso = document.getElementById('form-ingreso');
const formPago = document.getElementById('form-pago');
const formPresupuesto = document.getElementById('form-presupuesto');

const recentList = document.getElementById('recent-list');
const ingresosList = document.getElementById('ingresos-list');
const pagosList = document.getElementById('pagos-list');
const budgetsList = document.getElementById('budgets-list');

const currencySelector = document.getElementById('currency-selector');
const btnExport = document.getElementById('btn-export');

// Opciones de categorías según el tipo
const catOptions = {
    ingreso: ['Salario', 'Ventas', 'Inversiones', 'Otros'],
    pago: ['Comida', 'Transporte', 'Hogar', 'Entretenimiento', 'Suscripciones', 'Otros']
};

// Referencias a los gráficos
let chartBalanceInstance = null;
let chartCategoriesInstance = null;

// Navegación
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const target = item.getAttribute('data-target');
        pageTitle.textContent = target.charAt(0).toUpperCase() + target.slice(1);

        views.forEach(view => view.classList.remove('active-view'));
        document.getElementById(target).classList.add('active-view');
        
        document.querySelector('.main-content').scrollTop = 0;
    });
});

// Cambiar moneda
currencySelector.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    updateUI();
});

// Exportar CSV
btnExport.addEventListener('click', exportToCSV);

// Manejo de Formularios
formIngreso.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc-ingreso').value;
    const amount = parseFloat(document.getElementById('monto-ingreso').value);
    const cat = document.getElementById('cat-ingreso').value;
    const isFixed = document.getElementById('fijo-ingreso').checked;
    
    addTransaction(desc, amount, 'ingreso', cat, isFixed);
    formIngreso.reset();
});

formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc-pago').value;
    const amount = parseFloat(document.getElementById('monto-pago').value);
    const cat = document.getElementById('cat-pago').value;
    const isFixed = document.getElementById('fijo-pago').checked;
    
    addTransaction(desc, amount, 'pago', cat, isFixed);
    formPago.reset();
});

formPresupuesto.addEventListener('submit', (e) => {
    e.preventDefault();
    const cat = document.getElementById('cat-presupuesto').value;
    const amount = parseFloat(document.getElementById('monto-presupuesto').value);
    
    budgets[cat] = amount;
    updateUI();
    formPresupuesto.reset();
});

// Lógica Principal
function addTransaction(desc, amount, type, category, isFixed = false) {
    const transaction = {
        id: Date.now(),
        desc,
        amount,
        type,
        category,
        isFixed,
        date: new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    };
    transactions.push(transaction);
    updateUI();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currentCurrency }).format(value);
}

function updateUI() {
    let incomes = 0;
    let fixedIncomes = 0;
    let payments = 0;
    let fixedPayments = 0;

    transactions.forEach(t => {
        if (t.type === 'ingreso') {
            incomes += t.amount;
            if (t.isFixed) fixedIncomes += t.amount;
        } else if (t.type === 'pago') {
            payments += t.amount;
            if (t.isFixed) fixedPayments += t.amount;
        }
    });
        
    const balance = incomes - payments;

    // Actualizar tarjetas
    totalIncomesEl.textContent = formatCurrency(incomes);
    fixedIncomesEl.textContent = `Fijos: ${formatCurrency(fixedIncomes)}`;
    totalPaymentsEl.textContent = formatCurrency(payments);
    fixedPaymentsEl.textContent = `Fijos: ${formatCurrency(fixedPayments)}`;
    totalBalanceEl.textContent = formatCurrency(balance);
    totalBalanceEl.style.color = balance < 0 ? 'var(--text-main)' : 'var(--accent)';

    const reversedTransactions = [...transactions].reverse();

    renderList(recentList, reversedTransactions.slice(0, 5));
    renderList(ingresosList, reversedTransactions.filter(t => t.type === 'ingreso'));
    renderList(pagosList, reversedTransactions.filter(t => t.type === 'pago'));

    renderBudgets();
    updateCharts(incomes, payments);
}

function renderList(container, items) {
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<li style="justify-content: center; background: transparent;"><span class="text-muted">No hay registros aún</span></li>`;
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        const isIngreso = item.type === 'ingreso';
        const sign = isIngreso ? '+' : '-';
        const typeClass = isIngreso ? 'ingreso' : 'pago';
        
        const fixedBadge = item.isFixed ? `<span class="badge fixed">Fijo</span>` : '';
        const catBadge = item.category ? `<span class="badge cat">${item.category}</span>` : '';

        li.innerHTML = `
            <div class="info">
                <span class="desc">${item.desc} ${fixedBadge} ${catBadge}</span>
                <span class="date">${item.date}</span>
            </div>
            <div class="transaction-actions">
                <span class="monto ${typeClass}">${sign} ${formatCurrency(item.amount)}</span>
                <div class="actions">
                    <button onclick="openEditModal(${item.id})" class="btn-icon" title="Editar">✏️</button>
                    <button onclick="deleteTransaction(${item.id})" class="btn-icon" title="Borrar">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(li);
    });
}

// === Presupuestos ===
function renderBudgets() {
    budgetsList.innerHTML = '';
    
    if (Object.keys(budgets).length === 0) {
        budgetsList.innerHTML = `<p class="text-muted">No has fijado ningún presupuesto aún. Añade uno arriba.</p>`;
        return;
    }

    // Calcular gastos por categoría
    const spentByCategory = {};
    transactions.filter(t => t.type === 'pago').forEach(t => {
        spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });

    for (const [cat, limit] of Object.entries(budgets)) {
        const spent = spentByCategory[cat] || 0;
        const percentage = Math.min((spent / limit) * 100, 100).toFixed(1);
        
        let progressClass = 'progress-safe';
        if (percentage >= 90) progressClass = 'progress-danger';
        else if (percentage >= 70) progressClass = 'progress-warning';

        const div = document.createElement('div');
        div.className = 'budget-item';
        div.innerHTML = `
            <div class="budget-header">
                <span>${cat}</span>
                <span class="budget-stats">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill ${progressClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="budget-actions">
                <button onclick="deleteBudget('${cat}')" class="btn-icon" title="Eliminar Presupuesto">🗑️</button>
            </div>
        `;
        budgetsList.appendChild(div);
    }
}

function deleteBudget(category) {
    if (confirm(`¿Eliminar presupuesto de ${category}?`)) {
        delete budgets[category];
        updateUI();
    }
}

// === Gráficos (Chart.js) ===
function updateCharts(totalIncomes, totalPayments) {
    // 1. Gráfico Balance
    const ctxBalance = document.getElementById('chart-balance').getContext('2d');
    if (chartBalanceInstance) chartBalanceInstance.destroy();
    
    chartBalanceInstance = new Chart(ctxBalance, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Gastos'],
            datasets: [{
                label: 'Monto',
                data: [totalIncomes, totalPayments],
                backgroundColor: ['#1DB954', '#e91429'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 2. Gráfico Categorías (Gastos)
    const spentByCategory = {};
    transactions.filter(t => t.type === 'pago').forEach(t => {
        spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });

    const ctxCat = document.getElementById('chart-categories').getContext('2d');
    if (chartCategoriesInstance) chartCategoriesInstance.destroy();

    const labels = Object.keys(spentByCategory);
    const data = Object.values(spentByCategory);

    chartCategoriesInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sin gastos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? ['#1DB954', '#f39c12', '#e91429', '#3498db', '#9b59b6', '#8e44ad'] : ['#282828'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#B3B3B3', font: {size: 12} } }
            }
        }
    });
}

// === Funciones de Edición y Borrado ===
function deleteTransaction(id) {
    if (confirm('¿Estás seguro de que deseas borrar esta transacción?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateUI();
    }
}

const editModal = document.getElementById('edit-modal');
const formEdit = document.getElementById('form-edit');
const editCatSelect = document.getElementById('edit-cat');

function openEditModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('edit-id').value = transaction.id;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-desc').value = transaction.desc;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-fixed').checked = transaction.isFixed;

    // Llenar opciones de categoría según el tipo
    editCatSelect.innerHTML = '';
    catOptions[transaction.type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === transaction.category) option.selected = true;
        editCatSelect.appendChild(option);
    });

    editModal.classList.add('active');
}

function closeEditModal() { editModal.classList.remove('active'); }

formEdit.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value);
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index].desc = document.getElementById('edit-desc').value;
        transactions[index].amount = parseFloat(document.getElementById('edit-amount').value);
        transactions[index].category = document.getElementById('edit-cat').value;
        transactions[index].isFixed = document.getElementById('edit-fixed').checked;
        updateUI();
        closeEditModal();
    }
});

// === Exportar CSV ===
function exportToCSV() {
    if(transactions.length === 0) return alert('No hay datos para exportar');
    
    const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Es Fijo'];
    const rows = transactions.map(t => [
        t.id, `"${t.date}"`, t.type, t.category, `"${t.desc}"`, t.amount, t.isFixed ? 'Sí' : 'No'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + "\n"
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financify_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicializar UI con datos de ejemplo
transactions = [
    { id: 1, desc: "Salario Mensual", amount: 3500, type: "ingreso", category: "Salario", isFixed: true, date: "1 oct 2026, 09:00" },
    { id: 2, desc: "Suscripción Netflix", amount: 15.99, type: "pago", category: "Suscripciones", isFixed: true, date: "2 oct 2026, 10:15" },
    { id: 3, desc: "Cena Restaurante", amount: 45.50, type: "pago", category: "Comida", isFixed: false, date: "3 oct 2026, 20:30" },
    { id: 4, desc: "Uber a Oficina", amount: 12.00, type: "pago", category: "Transporte", isFixed: false, date: "4 oct 2026, 08:30" }
];
budgets = { "Comida": 200, "Suscripciones": 50 };
updateUI();