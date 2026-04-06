export function isSalaryTransaction(transaction, categories) {
    if (String(transaction?.type || "").toLowerCase() !== "income") {
        return false;
    }

    const category = categories.find(
        (item) => String(item.id) === String(transaction.category_id || "")
    );

    return String(category?.name || "").trim().toLowerCase() === "salary";
}

export function getDefaultAllocationForUser(user, allocations) {
    return [...allocations]
        .filter((allocation) => String(allocation.user || "") === String(user || ""))
        .sort((left, right) => Number(left.id || 0) - Number(right.id || 0))[0] || null;
}

export function getAllocationItems(allocationId, items) {
    return [...items]
        .filter((item) => String(item.allocation_id || "") === String(allocationId || ""))
        .sort((left, right) => Number(left.id || 0) - Number(right.id || 0));
}

export function validateAllocationItems(items) {
    if (!items.length) {
        return "Add at least one allocation item.";
    }

    const total = items.reduce((sum, item) => sum + Number(item.percentage || 0), 0);

    for (const item of items) {
        if (!String(item.label || "").trim()) {
            return "Each allocation item must have a label.";
        }

        if (Number(item.percentage || 0) <= 0) {
            return "Each allocation percentage must be greater than 0.";
        }
    }

    if (Math.abs(total - 100) > 0.001) {
        return "Allocation percentages must total 100.";
    }

    return "";
}

export function computeSalaryBreakdown(amount, items) {
    const salaryAmount = Number(amount || 0);
    const orderedItems = getAllocationItems(items[0]?.allocation_id, items);
    let allocated = 0;

    return orderedItems.map((item, index) => {
        const percentage = Number(item.percentage || 0);
        const isLast = index === orderedItems.length - 1;
        const nextAmount = isLast
            ? Number((salaryAmount - allocated).toFixed(2))
            : Number(((salaryAmount * percentage) / 100).toFixed(2));

        allocated += nextAmount;

        return {
            id: String(item.id),
            label: item.label,
            percentage,
            amount: nextAmount
        };
    });
}

export function toPieChartData(breakdown) {
    return breakdown.map((item) => ({
        name: `${item.label} (${item.percentage}%)`,
        value: Number(item.amount || 0)
    }));
}
