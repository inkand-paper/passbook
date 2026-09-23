/**
 * vault.js — Vault sync, unlock, and lock module
 * Handles all Supabase vault_items table interactions.
 * Encryption/decryption delegated to crypto.js.
 */

const Vault = (() => {
    const TABLE = 'vault_items';

    /** Default state for a brand new vault */
    function defaultVaultData() {
        return [
            {
                id: 'additional-passwords',
                isAdditional: true,
                email: 'Additional Passwords',
                name: 'Routers, Wi-Fi & System Keys',
                dob: '',
                gender: '',
                password: '',
                subAccounts: []
            }
        ];
    }

    /**
     * Unlock the vault: derive the AES key from the master password,
     * then fetch and decrypt the user's vault from Supabase.
     * If no vault exists yet, initialise a blank one.
     * @param {string} masterPassword
     * @throws {Error} If decryption fails (wrong master key)
     */
    async function unlock(masterPassword) {
        const db = AppState.supabase;
        const userId = AppState.currentUser.id;

        const { data: rows, error } = await db
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (rows && rows.length > 0) {
            const record = rows[0];
            const saltBytes = Crypto.saltFromBase64(record.salt);
            const cryptoKey = await Crypto.deriveKey(masterPassword, saltBytes);

            try {
                const decrypted = await Crypto.decrypt(record.encrypted_payload, record.iv, cryptoKey);
                AppState.masterSalt = saltBytes;
                AppState.masterCryptoKey = cryptoKey;
                AppState.passbookData = decrypted;
            } catch (_) {
                throw new Error('Incorrect Master Key — vault decryption failed.');
            }
        } else {
            // First time: initialise a fresh vault.
            // If a backup JSON was just imported (Reset Vault flow), keep it —
            // don't stomp it with the blank default.
            const salt = Crypto.generateSalt();
            const cryptoKey = await Crypto.deriveKey(masterPassword, salt);
            AppState.masterSalt = salt;
            AppState.masterCryptoKey = cryptoKey;
            if (!AppState.passbookData || AppState.passbookData.length === 0) {
                AppState.passbookData = defaultVaultData();
            }
            await save();
        }
    }

    /**
     * Encrypt the current passbookData and upsert it to Supabase.
     * Updates the sync status badge in the UI.
     */
    async function save() {
        if (!AppState.masterCryptoKey || !AppState.currentUser) return;

        _setSyncBadge('syncing');

        try {
            const db = AppState.supabase;
            const userId = AppState.currentUser.id;
            const encrypted = await Crypto.encrypt(AppState.passbookData, AppState.masterCryptoKey);
            const saltB64 = Crypto.saltToBase64(AppState.masterSalt);

            const { data: existing } = await db
                .from(TABLE)
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            if (existing && existing.length > 0) {
                await db.from(TABLE).update({
                    encrypted_payload: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: saltB64,
                    updated_at: new Date().toISOString()
                }).eq('id', existing[0].id);
            } else {
                await db.from(TABLE).insert({
                    user_id: userId,
                    encrypted_payload: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: saltB64
                });
            }
            _setSyncBadge('synced');
        } catch (err) {
            console.error('[Vault.save] Error:', err);
            _setSyncBadge('error');
        }
    }

    /**
     * Lock the vault: wipe the in-memory crypto key and data.
     */
    function lock() {
        AppState.masterCryptoKey = null;
        AppState.masterSalt = null;
        AppState.passbookData = [];
        AppState.expandedIds.clear();
        AppState.visiblePasswords.clear();
    }

    /** Update the cloud sync status badge in the dashboard header. */
    function _setSyncBadge(status) {
        const badge = document.getElementById('syncStatusBadge');
        if (!badge) return;
        const states = {
            syncing: {
                cls: 'text-amber-500 font-semibold flex items-center space-x-1',
                html: '<i data-lucide="refresh-cw" class="w-3.5 h-3.5 animate-spin"></i><span>Syncing...</span>'
            },
            synced: {
                cls: 'text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1',
                html: '<i data-lucide="cloud-check" class="w-3.5 h-3.5"></i><span>Cloud Synced</span>'
            },
            error: {
                cls: 'text-red-500 font-semibold flex items-center space-x-1',
                html: '<i data-lucide="cloud-off" class="w-3.5 h-3.5"></i><span>Sync Error</span>'
            }
        };
        const s = states[status] || states.error;
        badge.className = s.cls;
        badge.innerHTML = s.html;
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Check if a vault record exists for the current user in Supabase.
     * Used only to decide whether the unlock screen should show the
     * "confirm key" setup fields — it never gates whether unlock() itself
     * succeeds, since unlock() re-checks this directly.
     *
     * On query failure we deliberately return true (assume a vault exists)
     * rather than false. Returning false on error would send an existing
     * user into "setup mode" and force them to type their key twice for
     * no reason; returning true in error is the safe default because a
     * genuinely new user who gets a single-field prompt by mistake can
     * still create their vault fine — unlock() creates one automatically
     * when no rows are found.
     * @returns {Promise<boolean>}
     */
    async function hasVault() {
        if (!AppState.currentUser) return false;
        try {
            const db = AppState.supabase;
            const { data: rows, error } = await db
                .from(TABLE)
                .select('id')
                .eq('user_id', AppState.currentUser.id)
                .limit(1);
            if (error) throw error;
            return !!(rows && rows.length > 0);
        } catch (err) {
            console.warn('[Vault.hasVault] Could not verify vault existence, defaulting to unlock mode:', err);
            return true;
        }
    }

    /**
     * Reset/Delete the user's encrypted vault record from Supabase.
     */
    async function resetVault() {
        if (!AppState.currentUser) return;
        const db = AppState.supabase;
        await db.from(TABLE).delete().eq('user_id', AppState.currentUser.id);
        lock();
    }

    return { unlock, save, lock, hasVault, resetVault, defaultVaultData };
})();