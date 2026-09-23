/**
 * render.js — Spreadsheet table rendering module
 * Responsible for generating and updating the main accounts table DOM.
 */

const Render = (() => {
    /** Escape a string for safe HTML insertion */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /** Render the sub-accounts expanded panel for a given primary item */
    function _renderSubPanel(item) {
        const isAdditional = !!item.isAdditional;

        if (item.subAccounts.length === 0) {
            return `<div class="p-4 text-xs text-slate-400 italic text-center">
                No items added yet. Click the <span class="font-bold text-emerald-600">+</span> button to add one.
            </div>`;
        }

        const rows = item.subAccounts.map(sub => {
            const visible = AppState.visiblePasswords.has(sub.id);
            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(sub.app)}</td>
                    <td class="py-2 px-3 text-slate-600 dark:text-slate-400 mono-font">${escapeHtml(sub.username)}</td>
                    <td class="py-2 px-3">
                        <div class="flex items-center space-x-1">
                            <span class="mono-font px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                ${visible ? escapeHtml(sub.password) : '••••••••'}
                            </span>
                            <button type="button" onclick="UI.togglePassword('${sub.id}')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <i data-lucide="${visible ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
                            </button>
                            <button type="button" onclick="UI.copyToClipboard('${escapeHtml(sub.password)}')" class="text-slate-400 hover:text-emerald-600 cursor-pointer">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </td>
                    <td class="py-2 px-3 text-center">
                        <button type="button" onclick="Modals.openEditSub('${item.id}', '${sub.id}')" class="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                        </button>
                        <button type="button" onclick="Modals.deleteSub('${item.id}', '${sub.id}')" class="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="p-3 pl-8 pr-4">
                <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                    <div class="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>${isAdditional ? 'Extra Passwords & Keys' : `Linked accounts for ${escapeHtml(item.email)}`}</span>
                        <button type="button" onclick="Modals.openAddSub('${item.id}')" class="text-xs text-emerald-600 hover:underline flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="plus" class="w-3 h-3"></i><span>Add Item</span>
                        </button>
                    </div>
                    <table class="w-full text-xs text-left border-collapse">
                        <thead class="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th class="py-2 px-3">${isAdditional ? 'Device / Service Name' : 'Application / Website'}</th>
                                <th class="py-2 px-3">${isAdditional ? 'Username / SSID' : 'Username / Email'}</th>
                                <th class="py-2 px-3">Password / Key</th>
                                <th class="py-2 px-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /** Build a primary account row <tr> element */
    function _buildPrimaryRow(item, rowIndex) {
        const isExpanded = AppState.expandedIds.has(item.id);
        const isPassVisible = AppState.visiblePasswords.has(item.id);
        const isAdditional = !!item.isAdditional;

        const tr = document.createElement('tr');
        tr.className = `group transition-colors ${
            isAdditional
                ? (isExpanded ? 'bg-amber-50/50 dark:bg-amber-950/20 expanded' : 'bg-slate-50/80 dark:bg-slate-900/50 hover:bg-amber-50/30')
                : (isExpanded ? 'bg-blue-50/40 dark:bg-slate-800/80 expanded' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50')
        }`;

        tr.innerHTML = `
            <td class="py-3 px-3 text-center font-bold text-slate-400 text-xs">
                ${isAdditional
                    ? '<i data-lucide="shield-check" class="w-4 h-4 text-amber-500 mx-auto"></i>'
                    : rowIndex}
            </td>

            <td class="py-3 px-4 cursor-pointer select-none" onclick="UI.toggleExpand('${item.id}')">
                <div class="flex items-center justify-between space-x-2">
                    <span class="font-bold ${isAdditional ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'} flex items-center space-x-2 truncate">
                        <i data-lucide="${isAdditional ? 'key-round' : 'mail'}" class="w-4 h-4 ${isAdditional ? 'text-amber-500' : 'text-blue-500'} shrink-0"></i>
                        <span class="truncate">${escapeHtml(item.email)}</span>
                    </span>
                    <div class="flex items-center space-x-1 ${isAdditional ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-slate-700 text-blue-800 dark:text-blue-300'} px-2 py-0.5 rounded text-xs font-semibold shrink-0">
                        <span>${item.subAccounts.length} items</span>
                        <i data-lucide="chevron-down" class="w-3.5 h-3.5 arrow-rotate"></i>
                    </div>
                </div>
            </td>

            <td class="py-3 px-4">
                <div class="space-y-0.5 text-xs">
                    <div class="font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(item.name)}</div>
                    <div class="text-slate-500 dark:text-slate-400 text-[11px]">
                        ${item.dob ? `DOB: ${escapeHtml(item.dob)} ` : ''}
                        ${item.gender ? `• ${escapeHtml(item.gender)}` : ''}
                        ${!item.dob && !item.gender
                            ? `<span class="italic text-slate-400">${isAdditional ? 'Router & System Keys' : 'No details'}</span>`
                            : ''}
                    </div>
                </div>
            </td>

            <td class="py-3 px-4">
                ${isAdditional
                    ? `<span class="text-xs text-slate-400 italic">Expand row for keys</span>`
                    : `<div class="flex items-center space-x-2">
                        <span class="mono-font text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-[120px] inline-block">
                            ${isPassVisible ? escapeHtml(item.password) : '••••••••••••'}
                        </span>
                        <button type="button" onclick="UI.togglePassword('${item.id}')" class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                            <i data-lucide="${isPassVisible ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                        </button>
                        <button type="button" onclick="UI.copyToClipboard('${escapeHtml(item.password)}')" class="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                    </div>`
                }
            </td>

            <td class="py-3 px-3 text-center">
                <div class="flex items-center justify-center space-x-1">
                    <button type="button" onclick="Modals.openAddSub('${item.id}')" title="Add linked item" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md cursor-pointer">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    </button>
                    ${!isAdditional ? `
                        <button type="button" onclick="Modals.openEditPrimary('${item.id}')" title="Edit account" class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button type="button" onclick="Modals.deletePrimary('${item.id}')" title="Delete account" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md cursor-pointer">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : `
                        <span class="p-1.5 text-slate-300 dark:text-slate-700" title="System row — cannot delete">
                            <i data-lucide="lock" class="w-4 h-4"></i>
                        </span>
                    `}
                </div>
            </td>
        `;
        return tr;
    }

    /**
     * Re-render the entire spreadsheet table body from AppState.passbookData.
     * Called after any state change.
     */
    function table() {
        const tbody = document.getElementById('spreadsheetBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const query = AppState.searchQuery.toLowerCase().trim();
        const filtered = AppState.passbookData.filter(item => {
            if (!query) return true;
            return (
                item.email.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query) ||
                item.subAccounts.some(s =>
                    s.app.toLowerCase().includes(query) ||
                    s.username.toLowerCase().includes(query)
                )
            );
        });

        // Always render Additional Passwords row last
        const regular = filtered.filter(i => !i.isAdditional);
        const additional = filtered.filter(i => i.isAdditional);
        const sorted = [...regular, ...additional];

        if (sorted.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-10 text-center text-slate-400">
                        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p>No accounts found matching your search.</p>
                    </td>
                </tr>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let rowCounter = 1;
        sorted.forEach(item => {
            const primaryRow = _buildPrimaryRow(item, item.isAdditional ? '★' : rowCounter++);
            tbody.appendChild(primaryRow);

            if (AppState.expandedIds.has(item.id)) {
                const subTr = document.createElement('tr');
                subTr.className = 'bg-slate-50 dark:bg-slate-950';
                subTr.innerHTML = `
                    <td colspan="5" class="p-0 border-b border-slate-300 dark:border-slate-800">
                        ${_renderSubPanel(item)}
                    </td>`;
                tbody.appendChild(subTr);
            }
        });

        if (window.lucide) lucide.createIcons();
    }

    return { table, escapeHtml };
})();
