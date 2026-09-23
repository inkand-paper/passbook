/**
 * ui.js — UI utility functions shared across the app
 * Handles: view switching, dark mode, toast, clipboard, search, expand/collapse, export
 */

const UI = (() => {

    // ─── View Management ──────────────────────────────────────────────────

    function showView(viewId) {
        ['authView', 'masterKeyView', 'dashboardView'].forEach(id => {
            document.getElementById(id).classList.toggle('hidden', id !== viewId);
        });
        if (window.lucide) lucide.createIcons();
    }

    function showAuth() {
        showView('authView');
    }

    function showMasterKey() {
        const emailEl = document.getElementById('userBadgeEmail');
        if (emailEl && AppState.currentUser) emailEl.innerText = AppState.currentUser.email;
        showView('masterKeyView');
    }

    function showDashboard() {
        const emailEl = document.getElementById('activeUserEmail');
        if (emailEl && AppState.currentUser) emailEl.innerText = AppState.currentUser.email;
        Render.table();
        showView('dashboardView');
    }

    // ─── Auth Tab Switcher ────────────────────────────────────────────────

    function switchAuthTab(mode) {
        AppState.authMode = mode;
        const signinBtn  = document.getElementById('tabSignInBtn');
        const signupBtn  = document.getElementById('tabSignUpBtn');
        const submitText = document.getElementById('authSubmitText');
        const msgEl      = document.getElementById('authMessage');

        if (msgEl) { msgEl.innerText = ''; msgEl.className = 'text-xs text-center font-medium min-h-[1rem]'; }

        const activeClass   = 'flex-1 py-2.5 rounded-lg bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold cursor-pointer transition-all';
        const inactiveClass = 'flex-1 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 font-medium cursor-pointer transition-all';

        if (mode === 'signin') {
            signinBtn.className  = activeClass;
            signupBtn.className  = inactiveClass;
            submitText.innerText = 'Sign In to Vault';
        } else {
            signupBtn.className  = activeClass;
            signinBtn.className  = inactiveClass;
            submitText.innerText = 'Create Account';
        }
    }

    // ─── Password Masking & Input Visibility ──────────────────────────────

    function togglePassword(id) {
        if (AppState.visiblePasswords.has(id)) {
            AppState.visiblePasswords.delete(id);
        } else {
            AppState.visiblePasswords.add(id);
        }
        Render.table();
    }

    /**
     * Toggle password input visibility for any input field by ID.
     * @param {string} inputId
     * @param {string} iconId
     */
    function toggleFieldVisibility(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            if (icon) icon.setAttribute('data-lucide', 'eye');
        }
        if (window.lucide) lucide.createIcons();
    }

    // ─── Expand / Collapse Rows ───────────────────────────────────────────

    function toggleExpand(id) {
        if (AppState.expandedIds.has(id)) {
            AppState.expandedIds.delete(id);
        } else {
            AppState.expandedIds.add(id);
        }
        Render.table();
    }

    function expandAll() {
        AppState.passbookData.forEach(item => AppState.expandedIds.add(item.id));
        Render.table();
    }

    function collapseAll() {
        AppState.expandedIds.clear();
        Render.table();
    }

    // ─── Search ───────────────────────────────────────────────────────────

    function handleSearch() {
        AppState.searchQuery = document.getElementById('searchInput').value;
        Render.table();
    }

    // ─── Clipboard ────────────────────────────────────────────────────────

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Copied to clipboard!');
        });
    }

    // ─── Dark Mode ────────────────────────────────────────────────────────

    function toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        const icon   = document.getElementById('themeIcon');
        if (icon) icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        if (window.lucide) lucide.createIcons();
        localStorage.setItem('passbook_theme', isDark ? 'dark' : 'light');
    }

    function applyStoredTheme() {
        const stored = localStorage.getItem('passbook_theme');
        if (stored === 'dark') document.documentElement.classList.add('dark');
    }

    // ─── Toast Notification ───────────────────────────────────────────────

    function showToast(msg) {
        const toast   = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        if (!toast || !toastMsg) return;
        toastMsg.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2600);
    }

    // ─── Auth Message Helper ──────────────────────────────────────────────

    function setAuthMessage(msg, type = 'error') {
        const el = document.getElementById('authMessage');
        if (!el) return;
        const styles = {
            error:   'text-xs text-center font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-800',
            success: 'text-xs text-center font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800',
            warning: 'text-xs text-center font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800'
        };
        el.className = styles[type] || styles.error;
        el.innerHTML = msg;
    }

    function setUnlockMessage(msg) {
        const el = document.getElementById('unlockMessage');
        if (el) el.innerText = msg;
    }

    // ─── Export Vault Backup ──────────────────────────────────────────────

    function exportVaultBackup() {
        const blob = new Blob([JSON.stringify(AppState.passbookData, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `passbook_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup downloaded!');
    }

    return {
        showAuth, showMasterKey, showDashboard,
        switchAuthTab,
        togglePassword, toggleFieldVisibility, toggleExpand, expandAll, collapseAll,
        handleSearch, copyToClipboard,
        toggleDarkMode, applyStoredTheme,
        showToast, setAuthMessage, setUnlockMessage,
        exportVaultBackup
    };
})();
