import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "./context/AppProviders";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { RecurringDuesPage } from "./pages/RecurringDuesPage";
import { CategoriesPage } from "./pages/managers/CategoriesPage";
import { TagsPage } from "./pages/managers/TagsPage";
import { AccountsPage } from "./pages/managers/AccountsPage";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="recurring-dues" element={<RecurringDuesPage />} />
            <Route path="managers">
              <Route index element={<Navigate to="categories" replace />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
            </Route>
          </Route>
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
