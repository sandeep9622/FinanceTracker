class TransactionService {
    constructor(storageService) {
        this.storageService = storageService;
        this.transactions = [];
    }

    initialize() {
        this.transactions = this.storageService.loadTransactions();
    }

    addTransaction(transactionData) {
        const transaction = {
            id: Date.now().toString(),
            date: transactionData.date,
            amount: parseFloat(transactionData.amount),
            type: transactionData.type,
            category: transactionData.category || '',
            remarks: transactionData.remarks || '',
            createdAt: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.save();
        return transaction;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        return this.save();
    }

    clearAllTransactions() {
        this.transactions = [];
        return this.storageService.clearTransactions();
    }

    getTransactionsByDateRange(days) {
        if (days === 'all') {
            return this.transactions;
        }

        const startDate = DateUtils.getStartDateFromRange(parseInt(days));
        const endDate = DateUtils.getEndDate();

        return this.transactions.filter(transaction => 
            DateUtils.isDateWithinRange(transaction.date, startDate, endDate)
        );
    }

    getAllTransactions() {
        return this.transactions;
    }

    save() {
        return this.storageService.saveTransactions(this.transactions);
    }

    validateTransaction(transactionData) {
        const errors = [];

        if (!transactionData.date) {
            errors.push('Date is required');
        }

        if (!transactionData.amount || isNaN(parseFloat(transactionData.amount))) {
            errors.push('Valid amount is required');
        }

        if (!transactionData.type || !['credit', 'debit'].includes(transactionData.type)) {
            errors.push('Valid type is required');
        }

        if (transactionData.type === 'debit' && !transactionData.category) {
            errors.push('Category is required for debit transactions');
        }

        return errors;
    }
}