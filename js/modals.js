/**
 * modals.js — All modal open/close/submit/delete handlers
 * Handles: Primary account modal, Sub-account modal
 */

const Modals = (() => {

    // ─── Primary Account Modal ─────────────────────────────────────────────

    function openAddPrimary() {
        document.getElementById('primaryModalTitle').innerHTML =
            '<i data-lucide="mail" class="w-5 h-5 text-blue-400"></i><span>Add Account</span>';
        document.getElementById('primaryId').value = '';
        document.getElementById('primaryEmail').value = '';
        document.getElementById('primaryName').value = '';
        document.getElementById('primaryGender').value = '';
        document.getElementById('primaryDob').value = '';
        document.getElementById('primaryPassword').value = '';
        document.getElementById('primaryModal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function openEditPrimary(id) {
        const item = AppState.passbookData.find(x => x.id === id);
        if (!item) return;
        document.getElementById('primaryModalTitle').innerHTML =
            '<i data-lucide="pencil" class="w-5 h-5 text-blue-400"></i><span>Edit Account</span>';
        document.getElementById('primaryId').value = item.id;
        document.getElementById('primaryEmail').value = item.email;
        document.getElementById('primaryName').value = item.name;
        document.getElementById('primaryGender').value = item.gender;
        document.getElementById('primaryDob').value = item.dob;
        document.getElementById('primaryPassword').value = item.password;
        document.getElementById('primaryModal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function closePrimary() {
        document.getElementById('primaryModal').classList.add('hidden');
    }

    async function submitPrimary(e) {
        e.preventDefault();
        const id       = document.getElementById('primaryId').value;
        const email    = document.getElementById('primaryEmail').value.trim();
        const name     = document.getElementById('primaryName').value.trim();
        const gender   = document.getElementById('primaryGender').value;
        const dob      = document.getElementById('primaryDob').value.trim();
        const password = document.getElementById('primaryPassword').value;

        if (id) {
            // Edit existing
            const item = AppState.passbookData.find(x => x.id === id);
            if (item) Object.assign(item, { email, name, gender, dob, password });
        } else {
            // Add new
            const newId = Date.now().toString();
            AppState.passbookData.push({ id: newId, email, name, gender, dob, password, subAccounts: [] });
            AppState.expandedIds.add(newId);
        }

        closePrimary();
        Render.table();
        await Vault.save();
    }

    async function deletePrimary(id) {
        if (!confirm('Delete this account and all its linked services?')) return;
        AppState.passbookData = AppState.passbookData.filter(x => x.id !== id);
        AppState.expandedIds.delete(id);
        Render.table();
        await Vault.save();
    }

    // ─── Sub-Account Modal ─────────────────────────────────────────────────

    function openAddSub(parentId) {
        const isAdditional = parentId === 'additional-passwords';
        document.getElementById('subModalTitle').innerHTML = `
            <i data-lucide="${isAdditional ? 'key-round' : 'layers'}" class="w-5 h-5 text-emerald-300"></i>
            <span>${isAdditional ? 'Add Extra Password / Device' : 'Add Linked App Account'}</span>`;
        document.getElementById('subParentId').value = parentId;
        document.getElementById('subId').value = '';
        document.getElementById('subApp').value = '';
        document.getElementById('subUsername').value = '';
        document.getElementById('subPassword').value = '';
        document.getElementById('subModal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function openEditSub(parentId, subId) {
        const parent = AppState.passbookData.find(x => x.id === parentId);
        if (!parent) return;
        const sub = parent.subAccounts.find(s => s.id === subId);
        if (!sub) return;
        document.getElementById('subModalTitle').innerHTML =
            '<i data-lucide="pencil" class="w-5 h-5 text-emerald-300"></i><span>Edit Linked Item</span>';
        document.getElementById('subParentId').value = parentId;
        document.getElementById('subId').value = sub.id;
        document.getElementById('subApp').value = sub.app;
        document.getElementById('subUsername').value = sub.username;
        document.getElementById('subPassword').value = sub.password;
        document.getElementById('subModal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function closeSub() {
        document.getElementById('subModal').classList.add('hidden');
    }

    async function submitSub(e) {
        e.preventDefault();
        const parentId = document.getElementById('subParentId').value;
        const subId    = document.getElementById('subId').value;
        const app      = document.getElementById('subApp').value.trim();
        const username = document.getElementById('subUsername').value.trim();
        const password = document.getElementById('subPassword').value;

        const parent = AppState.passbookData.find(x => x.id === parentId);
        if (!parent) return;

        if (subId) {
            const sub = parent.subAccounts.find(s => s.id === subId);
            if (sub) Object.assign(sub, { app, username, password });
        } else {
            parent.subAccounts.push({ id: 'sub-' + Date.now().toString(), app, username, password });
        }

        AppState.expandedIds.add(parentId);
        closeSub();
        Render.table();
        await Vault.save();
    }

    async function deleteSub(parentId, subId) {
        if (!confirm('Delete this linked item?')) return;
        const parent = AppState.passbookData.find(x => x.id === parentId);
        if (!parent) return;
        parent.subAccounts = parent.subAccounts.filter(s => s.id !== subId);
        Render.table();
        await Vault.save();
    }

    return {
        openAddPrimary, openEditPrimary, closePrimary, submitPrimary, deletePrimary,
        openAddSub, openEditSub, closeSub, submitSub, deleteSub
    };
})();
