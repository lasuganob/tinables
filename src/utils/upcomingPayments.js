import { getTodayInAppTimeZone } from "../lib/format";

export function getUpcomingPaymentStatus(item, today = getTodayInAppTimeZone()) {
    if (String(item.status || "").toLowerCase() === "paid") {
        return "paid";
    }

    const dueDate = String(item.due_date || "");

    if (!dueDate) {
        return "scheduled";
    }

    if (dueDate < today) {
        return "overdue";
    }

    if (dueDate === today) {
        return "today";
    }

    return "scheduled";
}

function paymentPriority(item, today) {
    const status = getUpcomingPaymentStatus(item, today);

    if (status === "overdue") return 0;
    if (status === "today") return 1;
    if (status === "scheduled") return 2;
    return 3;
}

export function sortUpcomingPayments(items, today = getTodayInAppTimeZone()) {
    return [...items].sort((left, right) => {
        const priorityDifference = paymentPriority(left, today) - paymentPriority(right, today);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        const dueDateDifference = String(left.due_date || "").localeCompare(String(right.due_date || ""));

        if (dueDateDifference !== 0) {
            return dueDateDifference;
        }

        return Number(left.id || 0) - Number(right.id || 0);
    });
}

export function buildTransactionPrefillFromPayment(item, today = getTodayInAppTimeZone()) {
    return {
        date: today,
        type: "expense",
        account_id: "",
        category_id: String(item.category_id || ""),
        amount: String(item.amount ?? ""),
        user: String(item.user || ""),
        tags: [],
        note: String(item.note || ""),
        upcomingPaymentId: String(item.id || "")
    };
}
