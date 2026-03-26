/**
 * Ensures `amount` is a number and `tags` is always an array of strings.
 */
export function normaliseTransaction(item) {
    return {
        ...item,
        amount: Number(item.amount || 0),
        tags: Array.isArray(item.tags)
            ? item.tags
            : String(item.tags || "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
    };
}

/**
 * Sums transactions of a given type ("income" | "expense").
 */
export function totalByType(transactions, type) {
    return transactions
        .filter((transaction) => transaction.type === type)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

/**
 * Groups transactions by date and returns an array of { date, income, expense }.
 * Used for the line chart.
 */
export function groupCashflow(transactions) {
    const grouped = new Map();

    [...transactions]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach((transaction) => {
            const key = transaction.date;
            const current = grouped.get(key) || { date: key, income: 0, expense: 0 };
            current[transaction.type] += Number(transaction.amount || 0);
            grouped.set(key, current);
        });

    return [...grouped.values()];
}

/**
 * Returns expense totals per category, sorted descending.
 * Used for the pie chart.
 */
export function groupExpenseByCategory(transactions, categories) {
    const namesById = new Map(categories.map((category) => [String(category.id), category.name]));
    const totals = new Map();

    transactions
        .filter((transaction) => transaction.type === "expense")
        .forEach((transaction) => {
            const key = namesById.get(String(transaction.category_id)) || "Uncategorized";
            totals.set(key, (totals.get(key) || 0) + Number(transaction.amount || 0));
        });

    return [...totals.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}
