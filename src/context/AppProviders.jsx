import { useState } from "react";
import { AppFiltersProvider } from "./AppFiltersContext";
import { AppDataProvider } from "./AppDataContext";

/**
 * Bridges the circular dependency between AppFiltersProvider (needs transactions
 * to initialise the default month filter) and AppDataProvider (needs selectedUser
 * from filters). We lift a lightweight transactions-only state here so
 * AppFiltersProvider can receive it without a full bootstrap dependency.
 *
 * AppDataProvider owns the authoritative transactions list. When it loads data it
 * calls onTransactionsLoaded, which updates the bridge state used by
 * AppFiltersProvider.
 */
function AppProvidersInner({ transactions, onTransactionsChange, children }) {
  return (
    <AppFiltersProvider transactions={transactions}>
      <AppDataProvider onTransactionsChange={onTransactionsChange}>
        {children}
      </AppDataProvider>
    </AppFiltersProvider>
  );
}

export function AppProviders({ children }) {
  const [bridgeTransactions, setBridgeTransactions] = useState([]);

  return (
    <AppProvidersInner
      transactions={bridgeTransactions}
      onTransactionsChange={setBridgeTransactions}
    >
      {children}
    </AppProvidersInner>
  );
}
