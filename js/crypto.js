/**
 * crypto.js — Client-side AES-256-GCM encryption module
 * Uses the native Web Crypto API (window.crypto.subtle).
 */

const Crypto = (() => {
    /**
     * Helper to safely convert Uint8Array to base64 without hitting JS call stack limits.
     * Prevents "Maximum call stack size exceeded" on large data payloads.
     */
    function bytesToBase64(bytes) {
        let binString = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binString += String.fromCharCode(bytes[i]);
        }
        return btoa(binString);
    }

    /**
     * Helper to convert base64 string to Uint8Array safely.
     */
    function base64ToBytes(b64) {
        const binString = atob(b64);
        const len = binString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Derive an AES-GCM-256 key from a master password using PBKDF2.
     * Updated iteration count to 600,000 (OWASP Recommendation).
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
                iterations: 600000, // OWASP recommendation for PBKDF2-HMAC-SHA256
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
            ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
            iv: bytesToBase64(iv)
        };
    }

    /**
     * Decrypt a base64 ciphertext + IV back into a JavaScript object.
     */
    async function decrypt(ciphertextB64, ivB64, cryptoKey) {
        const dec = new TextDecoder();
        const ciphertext = base64ToBytes(ciphertextB64);
        const iv = base64ToBytes(ivB64);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            ciphertext
        );
        return JSON.parse(dec.decode(decryptedBuffer));
    }

    /**
     * Generate a random 16-byte salt.
     */
    function generateSalt() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    function saltToBase64(saltBytes) {
        return bytesToBase64(saltBytes);
    }

    function saltFromBase64(saltB64) {
        return base64ToBytes(saltB64);
    }

    function calculateStrength(pwd) {
        if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-300 dark:bg-slate-700', width: 'w-0' };
        let score = 0;
        if (pwd.length >= 8) score += 25;
        if (pwd.length >= 12) score += 15;
        if (pwd.length >= 16) score += 10;
        if (/[a-z]/.test(pwd)) score += 10;
        if (/[A-Z]/.test(pwd)) score += 15;
        if (/[0-9]/.test(pwd)) score += 10;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;

        if (score < 40) {
            return { score, label: 'Weak (Min 8 chars required)', color: 'bg-red-500', width: 'w-1/4' };
        } else if (score < 65) {
            return { score, label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
        } else if (score < 85) {
            return { score, label: 'Strong', color: 'bg-emerald-500', width: 'w-3/4' };
        } else {
            return { score, label: 'Enterprise Grade 🛡️', color: 'bg-blue-600', width: 'w-full' };
        }
    }

    function generatePassphrase() {
        const wordList = [
            "alpha", "anchor", "beacon", "bridge", "cannon", "castle", "cipher", "cobalt",
            "cosmic", "crystal", "dragon", "eagle", "emerald", "falcon", "forest", "galaxy",
            "granite", "harbor", "horizon", "island", "jaguar", "jungle", "knight", "legend",
            "matrix", "monarch", "nebula", "neutron", "ocean", "orbit", "panther", "phoenix",
            "planet", "prism", "pyramid", "quantum", "radar", "shadow", "shield", "silver",
            "solar", "spectrum", "sphere", "summit", "thunder", "titan", "vector", "vortex"
        ];
        const randomValues = new Uint32Array(12);
        crypto.getRandomValues(randomValues);
        return Array.from(randomValues).map(val => wordList[val % wordList.length]).join('-');
    }

    return { deriveKey, encrypt, decrypt, generateSalt, saltToBase64, saltFromBase64, calculateStrength, generatePassphrase };
})();