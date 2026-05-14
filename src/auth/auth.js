const PASSPHRASE = import.meta.env.VITE_APP_PASSPHRASE;
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Hashes a string using SHA-256 via the native Web Crypto API.
 * No external libraries needed.
 */
async function hash(input) {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Attempts login by comparing the user's input hash
 * against the hash of the stored passphrase.
 * Stores the hash and a timestamp in localStorage on success.
 *
 * @param {string} input - Raw passphrase typed by the user
 * @returns {Promise<boolean>}
 */
export async function login(input) {
  const [inputHash, passphraseHash] = await Promise.all([
    hash(input),
    hash(PASSPHRASE),
  ]);

  if (inputHash === passphraseHash) {
    localStorage.setItem("cf_auth", passphraseHash);
    localStorage.setItem("cf_last_active", Date.now().toString());
    return true;
  }

  return false;
}

/**
 * Checks if the current session is valid and not expired.
 * Automatically clears the session if it has expired.
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  const storedHash = localStorage.getItem("cf_auth");
  const lastActive = localStorage.getItem("cf_last_active");

  if (!storedHash || !lastActive) return false;

  const isExpired = Date.now() - parseInt(lastActive) > SESSION_DURATION;
  if (isExpired) {
    logout();
    return false;
  }

  return true;
}

/**
 * Updates the last active timestamp.
 * Call this on any user interaction to keep the session alive.
 */
export function refreshSession() {
  if (localStorage.getItem("cf_auth")) {
    localStorage.setItem("cf_last_active", Date.now().toString());
  }
}

/**
 * Clears all session data from localStorage.
 */
export function logout() {
  localStorage.removeItem("cf_auth");
  localStorage.removeItem("cf_last_active");
}
