import { parseDateValue } from "../lib/format";

/**
 * Ensures `amount` is a number and `tags` is always an array of strings.
 */
export function normaliseTransaction(item) {
    return {
        ...item,
        amount: Number(item.amount || 0),
        transfer_fee: Number(item.transfer_fee || 0),
        account_id: item.account_id ? String(item.account_id) : "",
        transfer_account_id: item.transfer_account_id ? String(item.transfer_account_id) : "",
        tags: Array.isArray(item.tags)
            ? item.tags
            : String(item.tags || "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
    };
}

/**
 * Sums transactions of a given type ("income" | "expense" | "transfer").
 */
export function totalByType(transactions, type) {
    return transactions
        .filter((transaction) => transaction.type === type)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

export function computeAccountBalances(accounts) {
    return accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

export function incomeByAccount(accounts) {
    const accountItems = accounts.map((account) => ({
        id: String(account.id),
        name: account.name,
        value: Number(account.balance || 0),
        user: account.user,
        type: account.type
    }));

    return accountItems.sort((left, right) => right.value - left.value);
}


function emptySeriesPointMap(dateKeys, seriesDefs) {
    const pointMap = new Map();

    dateKeys.forEach((dateKey) => {
        const seriesPoints = {};
        seriesDefs.forEach((seriesDef) => {
            seriesPoints[seriesDef.key] = 0;
        });
        pointMap.set(dateKey, seriesPoints);
    });

    return pointMap;
}

export function buildLineChartData(transactions, categories, tags, chartFilters) {
    const selectedCategoryId = String(chartFilters.selectedCategoryId || "");
    const selectedTagIds = (chartFilters.selectedTagIds || []).map(String);
    const activeTransactions = transactions.filter(
        (transaction) => transaction.type === "income" || transaction.type === "expense"
    );

    const categoryFilteredTransactions = selectedCategoryId
        ? activeTransactions.filter(
            (transaction) => String(transaction.category_id || "") === selectedCategoryId
        )
        : activeTransactions;

    const dateKeys = [
        ...new Set(
            categoryFilteredTransactions
                .map((transaction) => String(transaction.date || ""))
                .filter(Boolean)
        )
    ].sort((left, right) => parseDateValue(left) - parseDateValue(right));

    if (!dateKeys.length) {
        return { categories: [], series: [] };
    }

    if (selectedTagIds.length) {
        const tagNameById = new Map(tags.map((tag) => [String(tag.id), tag.name]));
        const seriesDefs = selectedTagIds.map((tagId, index) => ({
            key: tagId,
            name: tagNameById.get(tagId) || `Tag ${tagId}`,
            color: ["#2563eb", "#f59e0b", "#7c3aed", "#059669", "#dc2626", "#0891b2"][index % 6]
        }));
        const pointsByDate = emptySeriesPointMap(dateKeys, seriesDefs);

        categoryFilteredTransactions.forEach((transaction) => {
            const transactionTags = (transaction.tags || []).map(String);
            seriesDefs.forEach((seriesDef) => {
                if (transactionTags.includes(seriesDef.key)) {
                    const currentPoints = pointsByDate.get(String(transaction.date || ""));
                    if (currentPoints) {
                        currentPoints[seriesDef.key] += Number(transaction.amount || 0);
                    }
                }
            });
        });

        return {
            categories: dateKeys,
            series: seriesDefs.map((seriesDef) => ({
                name: seriesDef.name,
                color: seriesDef.color,
                data: dateKeys.map((dateKey) => pointsByDate.get(dateKey)?.[seriesDef.key] || 0)
            }))
        };
    }

    if (selectedCategoryId) {
        const category = categories.find(
            (item) => String(item.id) === selectedCategoryId
        );
        const categoryName = category?.name || "Selected Category";
        const seriesKey = "selected-category";
        const pointsByDate = emptySeriesPointMap(dateKeys, [{ key: seriesKey }]);

        categoryFilteredTransactions.forEach((transaction) => {
            const currentPoints = pointsByDate.get(String(transaction.date || ""));
            if (currentPoints) {
                currentPoints[seriesKey] += Number(transaction.amount || 0);
            }
        });

        return {
            categories: dateKeys,
            series: [
                {
                    name: categoryName,
                    color: category?.type === "income" ? "#059669" : "#dc2626",
                    data: dateKeys.map((dateKey) => pointsByDate.get(dateKey)?.[seriesKey] || 0)
                }
            ]
        };
    }

    const pointsByDate = emptySeriesPointMap(dateKeys, [
        { key: "income" },
        { key: "expense" }
    ]);

    categoryFilteredTransactions.forEach((transaction) => {
        const currentPoints = pointsByDate.get(String(transaction.date || ""));
        if (currentPoints && (transaction.type === "income" || transaction.type === "expense")) {
            currentPoints[transaction.type] += Number(transaction.amount || 0);
        }
    });

    return {
        categories: dateKeys,
        series: [
            {
                name: "Income",
                color: "#059669",
                data: dateKeys.map((dateKey) => pointsByDate.get(dateKey)?.income || 0)
            },
            {
                name: "Expense",
                color: "#dc2626",
                data: dateKeys.map((dateKey) => pointsByDate.get(dateKey)?.expense || 0)
            }
        ]
    };
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
