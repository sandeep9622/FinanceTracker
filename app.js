const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
// --- Custom Toaster & Modal Implementation ---
function showToast(message, duration = 3500) {
    const toaster = document.getElementById('customToaster');
    if (!toaster) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toaster.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, duration);
}

function showModal(message, onConfirm, onCancel) {
    const modal = document.getElementById('customModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.querySelector('.modal-message').textContent = message;
    // Remove previous listeners
    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const closeBtn = modal.querySelector('.modal-close');
    const cleanup = () => {
        modal.style.display = 'none';
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        closeBtn.onclick = null;
        modal.onkeydown = null;
    };
    confirmBtn.onclick = () => { cleanup(); if (onConfirm) onConfirm(); };
    cancelBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };
    closeBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };
    // ESC key closes modal
    modal.onkeydown = (e) => { if (e.key === 'Escape') { cleanup(); if (onCancel) onCancel(); } };
    setTimeout(() => { confirmBtn.focus(); }, 200);
}

class TransactionTrackerApp {
    constructor() {
        this.storageService = StorageService;
        this.transactionService = new TransactionService(this.storageService);
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeApp();
        this.balanceDisplay = document.getElementById('currentBalance');
    }

    initializeElements() {
        this.form = document.getElementById('transactionForm');
        this.dateInput = document.getElementById('date');
        this.amountInput = document.getElementById('amount');
        this.typeSelect = document.getElementById('type');
        this.categorySelect = document.getElementById('category');
        this.categoryGroup = document.getElementById('categoryGroup');
        this.remarksInput = document.getElementById('remarks');
        this.transactionsBody = document.getElementById('transactionsBody');
        this.noTransactions = document.getElementById('noTransactions');
        this.dateRangeSelect = document.getElementById('dateRange');
        this.backupBtn = document.getElementById('backupBtn');
        this.restoreBtn = document.getElementById('restoreBtn');
        this.restoreFileInput = document.getElementById('restoreFile');
        this.clearBtn = document.getElementById('clearBtn');
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.typeSelect.addEventListener('change', () => this.handleTypeChange());
        this.dateRangeSelect.addEventListener('change', () => this.renderTransactions());
        this.backupBtn.addEventListener('click', () => this.backupData());
        this.restoreBtn.addEventListener('click', () => this.restoreData());
        this.restoreFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.clearBtn.addEventListener('click', () => this.clearAllData());
    }

    initializeApp() {
        this.setDefaultDate();
        this.handleTypeChange();
        this.transactionService.initialize();
        this.renderTransactions();
        // Always show balance on load
        const allTransactions = this.transactionService.getAllTransactions();
        let credit = 0, debit = 0;
        allTransactions.forEach(t => {
            if (t.type === 'credit') credit += t.amount;
            else if (t.type === 'debit') debit += t.amount;
        });
        const balance = credit - debit;
        this.updateBalanceDisplay(balance);
    }

    setDefaultDate() {
        this.dateInput.value = DateUtils.formatDate(DateUtils.getToday());
    }

    handleTypeChange() {
        const isDebit = this.typeSelect.value === 'debit';
        this.categoryGroup.style.display = isDebit ? 'block' : 'none';
        if (!isDebit) {
            this.categorySelect.value = '';
        }
    }

    handleFormSubmit(event) {
        event.preventDefault();

        const formData = {
            date: this.dateInput.value,
            amount: this.amountInput.value,
            type: this.typeSelect.value,
            category: this.categorySelect.value,
            remarks: this.remarksInput.value
        };

        const errors = this.transactionService.validateTransaction(formData);
        if (errors.length > 0) {
            showToast('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        this.transactionService.addTransaction(formData);
        this.renderTransactions();

        // Only reset amount and category fields
        this.amountInput.value = '';
        this.categorySelect.value = '';
        // Do not reset date and type
    }

    renderTransactions() {
        const days = this.dateRangeSelect.value;
        const transactions = this.transactionService.getTransactionsByDateRange(days);

        // Calculate and show current balance
        const allTransactions = this.transactionService.getAllTransactions();
        let credit = 0, debit = 0;
        allTransactions.forEach(t => {
            if (t.type === 'credit') credit += t.amount;
            else if (t.type === 'debit') debit += t.amount;
        });
        const balance = credit - debit;
        this.updateBalanceDisplay(balance);

        if (transactions.length === 0) {
            this.transactionsBody.innerHTML = '';
            this.noTransactions.style.display = 'block';
            return;
        }

        this.noTransactions.style.display = 'none';
        this.transactionsBody.innerHTML = transactions.map(transaction => {
            const isDebit = transaction.type === 'debit';
            const sign = isDebit ? '-' : '+';
            const amountClass = isDebit ? 'amount-negative' : 'amount-positive';
            return `
            <tr>
                <td>${this.formatDisplayDate(transaction.date)}</td>
                <td class="${amountClass}">
                    ${sign}${transaction.amount.toFixed(2)}
                </td>
                <td>${this.capitalizeFirst(transaction.type)}</td>
                <td>${transaction.category ? this.capitalizeFirst(transaction.category) : '-'}</td>
                <td>${transaction.remarks || '-'}</td>
                <td>
                    <button class="delete-btn" onclick="app.deleteTransaction('${transaction.id}')" 
                            aria-label="Delete transaction">
                        Delete
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    updateBalanceDisplay(balance) {
        if (!this.balanceDisplay) return;
        // Color shade logic: green for positive, red for negative, intensity by 100s
        let color = '#333';
        let bg = '';
        if (balance > 0) {
            // Green shades
            const intensity = Math.min(255, 100 + Math.floor(Math.abs(balance) / 100) * 30);
            color = `rgb(0,${intensity},0)`;
            bg = `rgba(0,${intensity},0,0.08)`;
        } else if (balance < 0) {
            // Red shades
            const intensity = Math.min(255, 100 + Math.floor(Math.abs(balance) / 100) * 30);
            color = `rgb(${intensity},0,0)`;
            bg = `rgba(${intensity},0,0,0.08)`;
        }
        this.balanceDisplay.innerHTML = `Balance: <span style="color:${color};background:${bg};padding:2px 10px;border-radius:8px;">&#8377; ${balance.toFixed(2)}</span>`;
    }

    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    deleteTransaction(id) {
        showModal('Are you sure you want to delete this transaction?', () => {
            this.transactionService.deleteTransaction(id);
            this.renderTransactions();
            // Update balance after deletion
            const allTransactions = this.transactionService.getAllTransactions();
            let credit = 0, debit = 0;
            allTransactions.forEach(t => {
                if (t.type === 'credit') credit += t.amount;
                else if (t.type === 'debit') debit += t.amount;
            });
            const balance = credit - debit;
            this.updateBalanceDisplay(balance);
        });
    }

    backupData() {
        const transactions = this.transactionService.getAllTransactions();
        if (transactions.length === 0) {
            showToast('No transactions to backup');
            return;
        }

        const data = this.storageService.exportToJSON(transactions);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-backup-${DateUtils.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Update balance after backup (in case of UI refresh)
        const allTransactions = this.transactionService.getAllTransactions();
        let credit = 0, debit = 0;
        allTransactions.forEach(t => {
            if (t.type === 'credit') credit += t.amount;
            else if (t.type === 'debit') debit += t.amount;
        });
        const balance = credit - debit;
        this.updateBalanceDisplay(balance);
    }

    restoreData() {
        this.restoreFileInput.click();
        // Update balance after restore (in case of UI refresh)
        const allTransactions = this.transactionService.getAllTransactions();
        let credit = 0, debit = 0;
        allTransactions.forEach(t => {
            if (t.type === 'credit') credit += t.amount;
            else if (t.type === 'debit') debit += t.amount;
        });
        const balance = credit - debit;
        this.updateBalanceDisplay(balance);
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const transactions = this.storageService.importFromJSON(e.target.result);
                
                if (!Array.isArray(transactions)) {
                    throw new Error('Invalid data format');
                }

                showModal('This will replace all current transactions. Continue?', () => {
                    this.storageService.saveTransactions(transactions);
                    this.transactionService.initialize();
                    this.renderTransactions();
                    showToast('Data restored successfully');
                });
            } catch (error) {
                showToast('Error restoring data: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    clearAllData() {
        const transactions = this.transactionService.getAllTransactions();
        if (transactions.length === 0) {
            showToast('No data to clear');
            return;
        }

        showModal('WARNING: This will permanently delete all transactions. Download backup first?', () => {
            this.backupData();
            showModal('Are you absolutely sure you want to clear ALL data? This cannot be undone.', () => {
                this.transactionService.clearAllTransactions();
                this.renderTransactions();
                this.updateBalanceDisplay(0);
                showToast('All data cleared successfully');
            });
        });
    }
}

// Initialize the application
const app = new TransactionTrackerApp();
// Ensure balance is shown on page load (in case renderTransactions is not called yet)
window.addEventListener('DOMContentLoaded', function() {
    if (app && typeof app.updateBalanceDisplay === 'function') {
        const allTransactions = app.transactionService.getAllTransactions();
        let credit = 0, debit = 0;
        allTransactions.forEach(t => {
            if (t.type === 'credit') credit += t.amount;
            else if (t.type === 'debit') debit += t.amount;
        });
        const balance = credit - debit;
        app.updateBalanceDisplay(balance);
    }
});