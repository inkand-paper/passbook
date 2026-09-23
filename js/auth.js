/**
 * auth.js — Supabase authentication module
 * Handles: Sign In, Sign Up, Sign Out, Session restore
 */

const Auth = (() => {
    /**
     * Initialise the Supabase client from window.PASSBOOK_CONFIG.
     * Must be called once on DOMContentLoaded before any auth operations.
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    function initSupabase() {
        const cfg = window.PASSBOOK_CONFIG;
        if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
            throw new Error('PASSBOOK_CONFIG is missing. Check config.js.');
        }
        const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        AppState.supabase = client;
        return client;
    }

    /**
     * Restore existing session from local storage on page load.
     * @returns {Promise<object|null>} User object if session exists, else null
     */
    async function restoreSession() {
        const { data: { session } } = await AppState.supabase.auth.getSession();
        if (session) {
            AppState.currentUser = session.user;
            return session.user;
        }
        return null;
    }

    /**
     * Sign in an existing user with email + password.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>} User object on success
     * @throws {Error} On auth failure
     */
    async function signIn(email, password) {
        const { data, error } = await AppState.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        AppState.currentUser = data.user;
        return data.user;
    }

    /**
     * Register a new user with Supabase Auth.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{user: object, sessionActive: boolean}>}
     * @throws {Error} On registration failure or duplicate email
     */
    async function signUp(email, password) {
        const { data, error } = await AppState.supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Detect duplicate account (Supabase returns user with empty identities)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error('An account with this email already exists. Please sign in instead.');
        }

        const sessionActive = !!data.session;
        if (sessionActive) {
            AppState.currentUser = data.user;
        }

        return { user: data.user, sessionActive };
    }

    /**
     * Sign out the current user and clear app state.
     */
    async function signOut() {
        await AppState.supabase.auth.signOut();
        AppState.currentUser = null;
        AppState.masterCryptoKey = null;
        AppState.masterSalt = null;
        AppState.passbookData = [];
        AppState.expandedIds.clear();
        AppState.visiblePasswords.clear();
        AppState.searchQuery = '';
    }

    return { initSupabase, restoreSession, signIn, signUp, signOut };
})();
