import {
    Chart,
    ArcElement,
    Tooltip,
    Legend,
    PieController,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler
} from "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/+esm";

Chart.register(
    ArcElement,
    Tooltip,
    Legend,
    PieController,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler
);
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const typeInput = document.getElementById('type');
    const categoryInput = document.getElementById('category');
    const transactionsList = document.getElementById('transactions');
    const balanceElement = document.getElementById('balance');
    const incomeTotalElement = document.getElementById('income-total');
    const expenseTotalElement = document.getElementById('expense-total');
    const filterTypeInput = document.getElementById('filter-type');
    const filterCategoryInput = document.getElementById('filter-category');
    const themeToggle = document.getElementById('theme-toggle');
    
    const goalNameInput = document.getElementById('goal-name');
    const goalAmountInput = document.getElementById('goal-amount');
    const saveGoalBtn = document.getElementById('save-goal-btn');

    const goalTitle = document.getElementById('goal-title');
    const savedAmount = document.getElementById('saved-amount');
    const goalTotal = document.getElementById('goal-total');
    const remainingAmount = document.getElementById('remaining-amount');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');

let goal = JSON.parse(localStorage.getItem('goal')) || null;



    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let expenseChart = null;
    let balanceLineChart = null;

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    init();

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const transaction = {
            id: generateId(),
            description: descriptionInput.value.trim(),
            amount: parseFloat(amountInput.value),
            date: dateInput.value,
            type: typeInput.value,
            category: categoryInput.value
        };

        addTransaction(transaction);
        updateLocalStorage();
        updateUI();
        resetForm();
        showSuccessMessage('Transaccion añadida correctamente');
    });

    filterTypeInput.addEventListener('change', updateUI);
    filterCategoryInput.addEventListener('change', updateUI);

    themeToggle.addEventListener('change', function () {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

saveGoalBtn.addEventListener('click', function () {

    const name = goalNameInput.value.trim();
    const amount = parseFloat(goalAmountInput.value);

    if (name === '' || amount <= 0) {
        showErrorMessage('Completa correctamente la meta');
        return;
    }

    goal = {
        name,
        amount 
    };

    localStorage.setItem('goal', JSON.stringify(goal));

    updateGoalUI();

    showSuccessMessage('Meta guardada correctamente');
    });



    function init() {
        updateUI();
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    function addTransaction(transaction) {
        transactions.unshift(transaction);
    }

    function removeTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== parseInt(id));
    }

    function updateLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    function updateUI() {
        const filteredTransactions = filterTransactions();
        displayTransactions(filteredTransactions);
        updateBalance();
        updateSummary();
        updateGoalUI();
        updateChart();
        updateBalanceLineChart();

    }

    function filterTransactions() {
        const typeFilter = filterTypeInput.value;
        const categoryFilter = filterCategoryInput.value;

        return transactions.filter(transaction => {
            const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
            const categoryMatch = categoryFilter === 'all' || transaction.category === categoryFilter;
            return typeMatch && categoryMatch;
        });
    }

    function displayTransactions(transactionsToDisplay) {
        transactionsList.innerHTML = '';

        if (transactionsToDisplay.length === 0) {
            transactionsList.innerHTML = '<li class="no-transactions"><i class="fas fa-coins"></i> No se encontraron transacciones </li>';
            return;
        }

        transactionsToDisplay.forEach(transaction => {
            const sign = transaction.type === 'income' ? '+' : '-';
            const transactionElement = document.createElement('li');
            transactionElement.classList.add('transaction', transaction.type);

            transactionElement.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${transaction.category}</div>
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount">${sign}$${Math.abs(transaction.amount).toFixed(2)}</div>
                <button class="delete-btn" data-id="${transaction.id}" aria-label="Delete transaction">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;

            transactionsList.appendChild(transactionElement);
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                console.log('Delete clicked for ID:', id); // Debug
                removeTransaction(id);
                updateLocalStorage();
                updateUI();
                showSuccessMessage('Transaccion eliminada');
            });
        });
    }

    function updateBalance() {
        const amounts = transactions.map(transaction =>
            transaction.type === 'income' ? transaction.amount : -transaction.amount
        );

        const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
        balanceElement.textContent = `$${total}`;

        if (total > 0) {
            balanceElement.style.color = 'var(--income-color)';
        } else if (total < 0) {
            balanceElement.style.color = 'var(--expense-color)';
        } else {
            balanceElement.style.color = 'inherit';
        }
    }

    function updateSummary() {
        const income = transactions
            .filter(transaction => transaction.type === 'income')
            .reduce((acc, transaction) => acc + transaction.amount, 0)
            .toFixed(2);

        const expense = transactions
            .filter(transaction => transaction.type === 'expense')
            .reduce((acc, transaction) => acc + transaction.amount, 0)
            .toFixed(2);

        incomeTotalElement.textContent = `$${income}`;
        expenseTotalElement.textContent = `$${expense}`;
    }

    function updateGoalUI() {

        if (!goal) {
            return;
        }

        const balance = transactions
            .map(transaction =>
                transaction.type === 'income'
                    ? transaction.amount
                    : -transaction.amount
            )
            .reduce((acc, item) => acc + item, 0);

       const remaining = Math.max(goal.amount - balance, 0);

        let percentage = (balance / goal.amount) * 100;

        if (percentage < 0) {
            percentage = 0;
        }

        if (percentage > 100) {
            percentage = 100;
        }

        goalTitle.textContent = goal.name;

        savedAmount.textContent = `$${balance.toFixed(2)}`;
        goalTotal.textContent = `$${goal.amount.toFixed(2)}`;

        remainingAmount.textContent =
            remaining > 0
                ? `$${remaining.toFixed(2)}`
                : '$0.00';

        progressPercentage.textContent =
            `${percentage.toFixed(0)}% completado`;

        progressFill.style.width = `${percentage}%`;

       
        if (percentage >= 80) {
            progressFill.style.background = '#22c55e';
        }
        else if (percentage >= 50) {
            progressFill.style.background = '#facc15';
        }
        else {
            progressFill.style.background = '#8b5cf6';
        }

     
        if (percentage >= 100) {
            progressPercentage.textContent =
                '🎉 ¡Meta alcanzada!';
        }
    }

    function updateChart() {

        const categories = {};

       transactions.forEach(transaction => {

                if (!categories[transaction.category]) {
                    categories[transaction.category] = 0;
                }

                categories[transaction.category] += transaction.amount;
            });

        const labels = Object.keys(categories);
        const data = Object.values(categories);

        const ctx = document.getElementById('expenseChart');

        if (!ctx) {
            return;
        }

        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(ctx, {
            type: 'pie',

            data: {
                labels: labels,

                datasets: [{
                    data: data,

                    backgroundColor: [
                        '#8b5cf6',
                        '#06b6d4',
                        '#22c55e',
                        '#facc15',
                        '#f97316',
                        '#ef4444',
                        '#ec4899',
                        '#6366f1'
                    ],

                    borderWidth: 2
                }]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        position: 'bottom'
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {
                                return `$${context.parsed.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    function updateBalanceLineChart() {

        const ctx = document.getElementById('balanceLineChart');

        if (!ctx) {
            return;
        }

        const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        let runningBalance = 0;

        const labels = [];
        const data = [];

        sortedTransactions.forEach(transaction => {

            if (transaction.type === 'income') {
                runningBalance += transaction.amount;
            } else {
                runningBalance -= transaction.amount;
            }

            labels.push(formatDate(transaction.date));
            data.push(runningBalance.toFixed(2));
        });

        if (balanceLineChart) {
            balanceLineChart.destroy();
        }

        balanceLineChart = new Chart(ctx, {

            type: 'line',

            data: {

                labels: labels,

                datasets: [{

                    label: 'Balance',

                    data: data,

                    borderColor: '#8b5cf6',

                    backgroundColor: 'rgba(139, 92, 246, 0.2)',

                    fill: true,

                    tension: 0.3,

                    pointBackgroundColor: '#8b5cf6',

                    pointRadius: 4
                }]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        display: true
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {
                                return `Balance: $${context.parsed.y}`;
                            }
                        }
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true
                    }
                }
            }
        });
    }

    function resetForm() {
        form.reset();
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    function validateForm() {
        if (descriptionInput.value.trim() === '') {
            showErrorMessage('Porfavor ingresa una descripcion');
            descriptionInput.focus();
            return false;
        }

        if (amountInput.value === '' || parseFloat(amountInput.value) <= 0) {
            showErrorMessage('Por favor ingresa un monto valido');
            amountInput.focus();
            return false;
        }

        if (dateInput.value === '') {
            showErrorMessage('Por favor selecciona una fecha');
            dateInput.focus();
            return false;
        }

        if (categoryInput.value === '') {
            showErrorMessage('Porfavor selecciona una categoria');
            categoryInput.focus();
            return false;
        }

        return true;
    }

    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }, 100);
    }

    function showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }, 100);
    }

    function generateId() {
        return Date.now() + Math.floor(Math.random() * 1000); 
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
});
