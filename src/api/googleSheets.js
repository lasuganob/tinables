const BASE_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL?.trim() || "";

function assertBaseUrl() {
  if (!BASE_URL) {
    throw new Error("Set VITE_GOOGLE_SCRIPT_URL in .env before using the app.");
  }
}

function getConnectionHint() {
  return [
    "Google Sheets connection failed.",
    `URL: ${BASE_URL || "(missing VITE_GOOGLE_SCRIPT_URL)"}`,
    "Checks:",
    "1. Use the deployed web app URL ending in /exec, not /dev.",
    "2. Deploy Apps Script as Web app with access set to Anyone.",
    "3. If you changed the script, create a new deployment or update the existing deployment.",
    "4. Open the URL directly in a browser with ?action=getUsers and confirm it returns JSON.",
    "5. Confirm the sheet has tabs named transactions, categories, tags, and users."
  ].join("\n");
}

function buildUrl(action, params = {}) {
  assertBaseUrl();

  const url = new URL(BASE_URL);
  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      [
        "Apps Script returned a non-JSON response.",
        `HTTP status: ${response.status}`,
        "This usually means the URL points to the wrong deployment, requires Google sign-in, or returned an HTML error page."
      ].join("\n")
    );
  }

  if (!response.ok || data?.error) {
    throw new Error(data?.error || `Request failed with ${response.status}`);
  }

  return data;
}

export async function fetchData(action, params) {
  try {
    const response = await fetch(buildUrl(action, params), {
      method: "GET",
      mode: "cors",
      redirect: "follow",
      cache: "no-store"
    });
    return parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(getConnectionHint());
    }
    throw error;
  }
}

export async function postData(action, payload) {
  assertBaseUrl();

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action, payload })
    });

    return parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(getConnectionHint());
    }
    throw error;
  }
}

export async function loadBootstrapData(user) {
  const [transactions, categories, tags, users] = await Promise.all([
    fetchData("getTransactions", user ? { user } : {}),
    fetchData("getCategories"),
    fetchData("getTags"),
    fetchData("getUsers")
  ]);

  return { transactions, categories, tags, users };
}
