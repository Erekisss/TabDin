/**
 * Criptografia do cofre — roda 100% no navegador (Web Crypto API).
 *
 * - A senha mestra NUNCA sai do dispositivo.
 * - Chave AES-256-GCM derivada com PBKDF2-SHA256 (600.000 iterações) + salt único por usuário.
 * - O Supabase recebe apenas { ciphertext, iv } em base64.
 * - Um "verificador" (texto conhecido cifrado) permite checar a senha mestra sem armazená-la.
 */

const ITERATIONS = 600_000;
const VERIFIER_PLAINTEXT = "tabdin-vault-v1";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromB64(b64: string) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function newSalt() {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(masterPassword: string, saltB64: string) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJSON(key: CryptoKey, data: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(data)),
  );
  return { ciphertext: toB64(ct), iv: toB64(iv) };
}

export async function decryptJSON<T>(key: CryptoKey, ciphertext: string, iv: string): Promise<T> {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(iv) },
    key,
    fromB64(ciphertext),
  );
  return JSON.parse(dec.decode(pt)) as T;
}

export async function createVerifier(key: CryptoKey) {
  return encryptJSON(key, VERIFIER_PLAINTEXT);
}

export async function checkVerifier(key: CryptoKey, ciphertext: string, iv: string) {
  try {
    return (await decryptJSON<string>(key, ciphertext, iv)) === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}

export function generatePassword(
  length = 20,
  opts = { upper: true, lower: true, digits: true, symbols: true },
) {
  const sets = [
    opts.lower && "abcdefghijkmnopqrstuvwxyz",
    opts.upper && "ABCDEFGHJKLMNPQRSTUVWXYZ",
    opts.digits && "23456789",
    opts.symbols && "!@#$%&*?-_=+",
  ].filter(Boolean) as string[];
  if (!sets.length) return "";
  const all = sets.join("");
  const rand = (n: number) => {
    // rejeição para evitar viés de módulo
    const max = Math.floor(0xffffffff / n) * n;
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf);
    while (buf[0] >= max);
    return buf[0] % n;
  };
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < length) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const level = score <= 2 ? 0 : score <= 4 ? 1 : 2;
  return {
    level,
    label: ["Fraca", "Média", "Forte"][level],
    color: ["var(--ios-red)", "var(--ios-orange)", "var(--ios-green)"][level],
    pct: Math.min(100, Math.round((score / 6) * 100)),
  };
}
