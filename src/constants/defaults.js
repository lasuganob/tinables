export const emptyTransaction = {
    id: "",
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
    category_id: "",
    amount: "",
    note: "",
    tags: [],
    user: ""
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
