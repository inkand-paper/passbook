/**
 * crypto.js — Client-side AES-256-GCM encryption module
 * Uses the native Web Crypto API (window.crypto.subtle).
 * The Master Key never leaves the browser.
 *
 * Flow:
 *   masterPassword + salt → PBKDF2 → AES-GCM-256 key
 *   plaintext JSON         → encrypt → base64 ciphertext + IV
 *   base64 ciphertext + IV → decrypt → plaintext JSON
 */

const Crypto = (() => {
    /**
     * Derive an AES-GCM-256 key from a master password using PBKDF2.
     * @param {string} masterPassword
     * @param {Uint8Array} saltBytes
     * @returns {Promise<CryptoKey>}
     */
    async function deriveKey(masterPassword, saltBytes) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(masterPassword),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        return await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: saltBytes,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypt a JavaScript object using AES-GCM-256.
     * @param {object} dataObj  - The plaintext object to encrypt
     * @param {CryptoKey} cryptoKey
     * @returns {Promise<{ciphertext: string, iv: string}>} base64 encoded strings
     */
    async function encrypt(dataObj, cryptoKey) {
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = enc.encode(JSON.stringify(dataObj));
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            encoded
        );
        return {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    /**
     * Decrypt a base64 ciphertext + IV back into a JavaScript object.
     * @param {string} ciphertextB64
     * @param {string} ivB64
     * @param {CryptoKey} cryptoKey
     * @returns {Promise<object>}
     */
    async function decrypt(ciphertextB64, ivB64, cryptoKey) {
        const dec = new TextDecoder();
        const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            ciphertext
        );
        return JSON.parse(dec.decode(decryptedBuffer));
    }

    /**
     * Generate a random 16-byte salt.
     * @returns {Uint8Array}
     */
    function generateSalt() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    /**
     * Convert a Uint8Array salt to base64 string for storage.
     * @param {Uint8Array} saltBytes
     * @returns {string}
     */
    function saltToBase64(saltBytes) {
        return btoa(String.fromCharCode(...saltBytes));
    }

    /**
     * Convert a base64 salt string back to Uint8Array.
     * @param {string} saltB64
     * @returns {Uint8Array}
     */
    function saltFromBase64(saltB64) {
        return Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    }

    return { deriveKey, encrypt, decrypt, generateSalt, saltToBase64, saltFromBase64 };
})();
