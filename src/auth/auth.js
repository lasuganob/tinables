const PASSPHRASE = import.meta.env.VITE_APP_PASSPHRASE;
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 2 hours in milliseconds
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rightRotate(value, bits) {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256Fallback(input) {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const bodyLength = bytes.length + 1;
  const paddingLength = (64 - ((bodyLength + 8) % 64)) % 64;
  const totalLength = bodyLength + paddingLength + 8;
  const data = new Uint8Array(totalLength);
  const view = new DataView(data.buffer);

  data.set(bytes);
  data[bytes.length] = 0x80;
  view.setUint32(totalLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(totalLength - 4, bitLength >>> 0);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      words[i] = view.getUint32(offset + i * 4);
    }

    for (let i = 16; i < 64; i += 1) {
      const s0 = rightRotate(words[i - 15], 7) ^ rightRotate(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rightRotate(words[i - 2], 17) ^ rightRotate(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[i] + words[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((value) => value.toString(16).padStart(8, "0"))
    .join("");
}

/**
 * Hashes a string using SHA-256. Web Crypto is unavailable on plain HTTP LAN
 * origins in some browsers, so a JS fallback keeps local network auth working.
 */
async function hash(input) {
  const value = String(input ?? "");

  if (!globalThis.crypto?.subtle?.digest) {
    return sha256Fallback(value);
  }

  const encoded = new TextEncoder().encode(value);
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", encoded);
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
