// Array para almacenar los datos (se podría conectar a localStorage o a un backend SaaS)
let transactions = [];

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

const recentList = document.getElementById('recent-list');
const ingresosList = document.getElementById('ingresos-list');
const pagosList = document.getElementById('pagos-list');

// Navegación (Estilo Single Page App)
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Actualizar menú activo
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Actualizar título
        const target = item.getAttribute('data-target');
        
        // Formatear título con primera letra mayúscula
        pageTitle.textContent = target.charAt(0).toUpperCase() + target.slice(1);

        // Actualizar vista visible
        views.forEach(view => view.classList.remove('active-view'));
        document.getElementById(target).classList.add('active-view');
        
        // Scroll top en móvil al cambiar de vista
        document.querySelector('.main-content').scrollTop = 0;
    });
});

// Manejo de Formularios (SaaS)
formIngreso.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc-ingreso').value;
    const amount = parseFloat(document.getElementById('monto-ingreso').value);
    const isFixed = document.getElementById('fijo-ingreso').checked;
    
    addTransaction(desc, amount, 'ingreso', isFixed);
    formIngreso.reset();
});

formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc-pago').value;
    const amount = parseFloat(document.getElementById('monto-pago').value);
    const isFixed = document.getElementById('fijo-pago').checked;
    
    addTransaction(desc, amount, 'pago', isFixed);
    formPago.reset();
});

// Lógica Principal
function addTransaction(desc, amount, type, isFixed = false) {
    const transaction = {
        id: Date.now(),
        desc,
        amount,
        type,
        isFixed,
        date: new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    transactions.push(transaction);
    updateUI();
}

// Formatear moneda
function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

// Actualizar la interfaz con los nuevos datos
function updateUI() {
    // Calcular totales
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

    // Actualizar tarjetas del Dashboard
    totalIncomesEl.textContent = formatCurrency(incomes);
    fixedIncomesEl.textContent = `Fijos (Recurrentes): ${formatCurrency(fixedIncomes)}`;
    
    totalPaymentsEl.textContent = formatCurrency(payments);
    fixedPaymentsEl.textContent = `Fijos (Suscripciones): ${formatCurrency(fixedPayments)}`;
    
    totalBalanceEl.textContent = formatCurrency(balance);
    
    // Cambiar color del balance si es negativo
    if (balance < 0) {
        totalBalanceEl.style.color = 'var(--text-main)';
    } else {
        totalBalanceEl.style.color = 'var(--accent)';
    }

    // Ordenar transacciones de más reciente a más antigua
    const reversedTransactions = [...transactions].reverse();

    // Renderizar Listas
    renderList(recentList, reversedTransactions.slice(0, 5)); // Últimos 5
    renderList(ingresosList, reversedTransactions.filter(t => t.type === 'ingreso'));
    renderList(pagosList, reversedTransactions.filter(t => t.type === 'pago'));
}

// Función para renderizar elementos en el DOM
function renderList(container, items) {
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = `
            <li style="justify-content: center; background: transparent;">
                <span style="color: var(--text-muted);">No hay registros aún</span>
            </li>
        `;
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        const isIngreso = item.type === 'ingreso';
        const sign = isIngreso ? '+' : '-';
        const typeClass = isIngreso ? 'ingreso' : 'pago';
        
        // Badge si es fijo
        const fixedBadge = item.isFixed ? `<span class="badge fixed">Fijo</span>` : '';

        li.innerHTML = `
            <div class="info">
                <span class="desc">${item.desc} ${fixedBadge}</span>
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

// === Funciones de Edición y Borrado ===

function deleteTransaction(id) {
    if (confirm('¿Estás seguro de que deseas borrar esta transacción?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateUI();
    }
}

const editModal = document.getElementById('edit-modal');
const formEdit = document.getElementById('form-edit');

function openEditModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('edit-id').value = transaction.id;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-desc').value = transaction.desc;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-fixed').checked = transaction.isFixed;

    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
}

formEdit.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const desc = document.getElementById('edit-desc').value;
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const isFixed = document.getElementById('edit-fixed').checked;

    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index].desc = desc;
        transactions[index].amount = amount;
        transactions[index].isFixed = isFixed;
        updateUI();
        closeEditModal();
    }
});

// Inicializar UI con datos de ejemplo (Simulando un SaaS con historial)
transactions = [
    { id: 1, desc: "Salario Mensual", amount: 3500, type: "ingreso", isFixed: true, date: "1 oct 2026, 09:00" },
    { id: 2, desc: "Suscripción Netflix", amount: 15.99, type: "pago", isFixed: true, date: "2 oct 2026, 10:15" },
    { id: 3, desc: "Cena Restaurante", amount: 45.50, type: "pago", isFixed: false, date: "3 oct 2026, 20:30" }
];
updateUI();