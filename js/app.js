/**
 * app.js — Application bootstrap and event wiring
 * This is the entry point that runs on DOMContentLoaded.
 * It initialises Supabase, restores sessions, and wires all form events.
 */

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Apply persisted dark/light theme
    UI.applyStoredTheme();

    // 2. Initialise Supabase client
    try {
        Auth.initSupabase();
    } catch (err) {
        alert('Failed to initialise Supabase: ' + err.message + '\nCheck your config.js file.');
        return;
    }

    // 3. Restore existing session (e.g. page refresh)
    const existingUser = await Auth.restoreSession();
    if (existingUser) {
        UI.showMasterKey();
    } else {
        UI.showAuth();
    }

    // ─── Auth Form ──────────────────────────────────────────────────────
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;

        try {
            if (AppState.authMode === 'signin') {
                await Auth.signIn(email, password);
                UI.showMasterKey();
            } else {
                const { sessionActive } = await Auth.signUp(email, password);
                if (sessionActive) {
                    UI.showMasterKey();
                    UI.showToast('Account created! Set your Master Key to continue.');
                } else {
                    UI.setAuthMessage(
                        'Account created! <b>Confirm Email</b> is enabled in your Supabase project — please check your inbox, then sign in.<br><br>' +
                        '<span class="opacity-70">Tip: Disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email for instant access.</span>',
                        'warning'
                    );
                }
            }
        } catch (err) {
            UI.setAuthMessage(err.message || 'Authentication failed.', 'error');
        }
    });

    // ─── Master Key Real-time Strength Meter & Generator ─────────────────
    const masterKeyInput = document.getElementById('masterKeyInput');
    const strengthBar = document.getElementById('masterKeyStrengthBar');
    const strengthText = document.getElementById('masterKeyStrengthText');

    function updateStrength() {
        if (!masterKeyInput || !strengthBar || !strengthText) return;
        const res = Crypto.calculateStrength(masterKeyInput.value);
        strengthBar.className = `h-full transition-all duration-300 ${res.color} ${res.width}`;
        strengthText.innerText = res.label;
        strengthText.className = `font-bold ${res.score < 40 ? 'text-red-500' : res.score < 65 ? 'text-amber-500' : 'text-emerald-500'}`;
    }

    masterKeyInput?.addEventListener('input', updateStrength);

    document.getElementById('generatePassphraseBtn')?.addEventListener('click', () => {
        const phrase = Crypto.generatePassphrase();
        masterKeyInput.value = phrase;
        masterKeyInput.type = 'text'; // Reveal generated phrase for easy copying
        const icon = document.getElementById('masterKeyIcon');
        if (icon) icon.setAttribute('data-lucide', 'eye-off');
        if (window.lucide) lucide.createIcons();
        updateStrength();
        UI.showToast('12-Word Passphrase generated!');
    });

    // ─── Master Key / Unlock Form ────────────────────────────────────────
    document.getElementById('masterKeyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const masterPassword = masterKeyInput.value;
        UI.setUnlockMessage('');

        if (masterPassword.length < 8) {
            UI.setUnlockMessage('Master Key must be at least 8 characters long for zero-knowledge security.');
            return;
        }

        const btn = document.getElementById('unlockBtn');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Unlocking...</span>';
        if (window.lucide) lucide.createIcons();

        try {
            await Vault.unlock(masterPassword);
            UI.showDashboard();
            UI.showToast('Vault unlocked!');
        } catch (err) {
            UI.setUnlockMessage(err.message || 'Could not unlock vault.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="unlock" class="w-4 h-4"></i><span>Unlock Vault</span>';
            if (window.lucide) lucide.createIcons();
        }
    });

    // ─── Primary Account Form ────────────────────────────────────────────
    document.getElementById('primaryForm').addEventListener('submit', Modals.submitPrimary);

    // ─── Sub Account Form ────────────────────────────────────────────────
    document.getElementById('subForm').addEventListener('submit', Modals.submitSub);

    // ─── Sign Out button ─────────────────────────────────────────────────
    document.querySelectorAll('[data-action="signout"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            await Auth.signOut();
            Vault.lock();
            UI.showAuth();
        });
    });

    // ─── Lock Vault button ──────────────────────────────────────────────
    document.querySelector('[data-action="lock"]')?.addEventListener('click', () => {
        Vault.lock();
        document.getElementById('masterKeyInput').value = '';
        UI.showMasterKey();
    });

    // ─── Dashboard header buttons ────────────────────────────────────────
    document.querySelector('[data-action="sync"]')?.addEventListener('click', Vault.save);
    document.querySelector('[data-action="add-primary"]')?.addEventListener('click', Modals.openAddPrimary);
    document.querySelector('[data-action="export"]')?.addEventListener('click', UI.exportVaultBackup);
    document.querySelector('[data-action="dark-mode"]')?.addEventListener('click', UI.toggleDarkMode);
    document.querySelector('[data-action="expand-all"]')?.addEventListener('click', UI.expandAll);
    document.querySelector('[data-action="collapse-all"]')?.addEventListener('click', UI.collapseAll);

    // ─── Auth tab buttons ─────────────────────────────────────────────────
    document.getElementById('tabSignInBtn').addEventListener('click', () => UI.switchAuthTab('signin'));
    document.getElementById('tabSignUpBtn').addEventListener('click', () => UI.switchAuthTab('signup'));
});
