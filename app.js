// Array para almacenar los datos (se podría conectar a localStorage más adelante)
let transactions = [];

// Elementos del DOM
const navItems = document.querySelectorAll('#nav-menu li');
const views = document.querySelectorAll('.view');
const pageTitle = document.getElementById('page-title');

const totalBalanceEl = document.getElementById('total-balance');
const totalIncomesEl = document.getElementById('total-incomes');
const totalPaymentsEl = document.getElementById('total-payments');

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
    });
});

// Manejo de Formularios
formIngreso.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc-ingreso').value;
    const amount = parseFloat(document.getElementById('monto-ingreso').value);
    
    addTransaction(desc, amount, 'ingreso');
    formIngreso.reset();
});

formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc-pago').value;
    const amount = parseFloat(document.getElementById('monto-pago').value);
    
    addTransaction(desc, amount, 'pago');
    formPago.reset();
});

// Lógica Principal
function addTransaction(desc, amount, type) {
    const transaction = {
        id: Date.now(),
        desc,
        amount,
        type,
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
    const incomes = transactions
        .filter(t => t.type === 'ingreso')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const payments = transactions
        .filter(t => t.type === 'pago')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const balance = incomes - payments;

    // Actualizar tarjetas del Dashboard
    totalIncomesEl.textContent = formatCurrency(incomes);
    totalPaymentsEl.textContent = formatCurrency(payments);
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

        li.innerHTML = `
            <div class="info">
                <span class="desc">${item.desc}</span>
                <span class="date">${item.date}</span>
            </div>
            <span class="monto ${typeClass}">${sign} ${formatCurrency(item.amount)}</span>
        `;
        
        container.appendChild(li);
    });
}

// Inicializar UI vacía
updateUI();