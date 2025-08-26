class DateUtils {
    static formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    static getToday() {
        return new Date();
    }

    static getDateFromString(dateString) {
        return new Date(dateString);
    }

    static isDateWithinRange(date, startDate, endDate) {
        const transactionDate = new Date(date);
        return transactionDate >= startDate && transactionDate <= endDate;
    }

    static getStartDateFromRange(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    static getEndDate() {
        return new Date();
    }
}