import { getTodayInAppTimeZone } from "../lib/format";

export const emptyTransaction = {
    id: "",
    date: getTodayInAppTimeZone(),
    type: "expense",
    category_id: "",
    account_id: "",
    transfer_account_id: "",
    transfer_fee: "",
    amount: "",
    note: "",
    tags: [],
    user: "",
    upcomingPaymentId: "",
    source_salary_transaction_id: "",
    salary_allocation_item_id: "",
    is_salary_allocation_base: 0
};

export const emptyCategory = {
    id: "",
    name: "",
    type: "expense"
};

export const emptyTag = {
    id: "",
    name: ""
};

export const emptyAccount = {
    id: "",
    name: "",
    type: 1,
    balance: "",
    is_active: 1,
    user: ""
};

export const fallbackAccountTypes = [
    { id: 1, name: "cash" },
    { id: 2, name: "e-wallet" },
    { id: 3, name: "bank" },
    { id: 4, name: "savings" }
];
