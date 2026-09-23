/**
 * state.js — Centralized application state
 * All modules import/export from this shared state object.
 * Never directly mutate state from outside — use setState() helpers where possible.
 */

window.AppState = {
    /** @type {import('@supabase/supabase-js').SupabaseClient|null} */
    supabase: null,

    /** @type {object|null} Supabase auth user object */
    currentUser: null,

    /** @type {CryptoKey|null} AES-GCM key derived from master password */
    masterCryptoKey: null,

    /** @type {Uint8Array|null} PBKDF2 salt stored per vault */
    masterSalt: null,

    /** @type {'signin'|'signup'} Current auth tab mode */
    authMode: 'signin',

    /** @type {Array} Main vault data array */
    passbookData: [],

    /** @type {Set<string>} IDs of expanded accordion rows */
    expandedIds: new Set(),

    /** @type {Set<string>} IDs of visible (unmasked) password fields */
    visiblePasswords: new Set(),

    /** @type {string} Current search query string */
    searchQuery: ''
};
