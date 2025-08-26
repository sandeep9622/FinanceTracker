class StorageService {
    static STORAGE_KEY = 'financial_transactions';

    static saveTransactions(transactions) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    }

    static loadTransactions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    static clearTransactions() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing transactions:', error);
            return false;
        }
    }

    static exportToJSON(transactions) {
        return JSON.stringify(transactions, null, 2);
    }

    static importFromJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            throw new Error('Invalid JSON format');
        }
    }
}