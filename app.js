/**
 * AB Serve - QA Tracker Flagship Logic (Phase 8)
 */

const REF_MAP = {
    "PAE0001227": "CR3 Light Guide Top T1",
    "PAE0001229": "CR3 Light Guide Bottom T1"
};

const FieldConfig = {
    'One Tech': {
        clients: ['Marelli', 'OP Mobility'],
        fields: [
            { id: 'etiquette-lat', label: 'رقم الملصق (N.Etiquette)', exportKey: 'N.Etiquette', type: 'number', isPrimary: true },
            { id: 'lot-num-lat', label: 'رقم الدفعة (Lot Number)', exportKey: 'Lot Number', type: 'text' },
            { id: 'date-ar', label: 'تاريخ الإنتاج (Date)', exportKey: 'Date', type: 'date', sticky: true },
            { id: 'qty-checked-lat', label: 'الكمية المفحوصة (Qty Checked)', exportKey: 'Qty Checked', type: 'number', sticky: true, triggerCalc: true, isQtySum: true },
            { id: 'qty-reworked-lat', label: 'الكمية المعاد إصلاحها (Reworked)', exportKey: 'Qty Reworked', type: 'number' }
        ]
    },
    'Martur Fompak': {
        clients: ['Martur'],
        fields: [
            { id: 'serial-lat', label: 'الرقم التسلسلي (Serial Number)', exportKey: 'Serial Number', type: 'text', isPrimary: true },
            { id: 'batch-num-lat', label: 'رقم الدفعة (Batch Number)', exportKey: 'Batch Number', type: 'text' },
            { id: 'date-ar', label: 'تاريخ الإنتاج (Date)', exportKey: 'Date', type: 'date', sticky: true },
            { id: 'qty-checked-lat', label: 'الكمية المفحوصة (Qty Checked)', exportKey: 'Qty Checked', type: 'number', sticky: true, triggerCalc: true, isQtySum: true },
            { id: 'qty-reworked-lat', label: 'الكمية المعاد إصلاحها (Reworked)', exportKey: 'Qty Reworked', type: 'number' }
        ]
    },
    'Gentherm Vietnam': {
        clients: ['JOYSON'],
        fields: [
            { id: 'delivery-note-lat', label: 'رقم الإرسالية (Delivery Note)', exportKey: 'Delivery Note', type: 'text', isPrimary: true },
            { id: 'batch-num-lat', label: 'رقم الدفعة (Batch Number)', exportKey: 'Batch Number', type: 'text' },
            { id: 'date-ar', label: 'التاريخ (Date)', exportKey: 'Date', type: 'date', sticky: true },
            { id: 'qty-checked-lat', label: 'الكمية المفحوصة (Qty Checked)', exportKey: 'Qty Checked', type: 'number', sticky: true, triggerCalc: true, isQtySum: true },
            { id: 'qty-reworked-lat', label: 'الكمية المعاد إصلاحها (Reworked)', exportKey: 'Qty Reworked', type: 'number' }
        ]
    },
    'Voltaira': {
        clients: ['JOYSON'],
        fields: [
            { id: 'delivery-note-lat', label: 'رقم الإرسالية (Delivery Note)', exportKey: 'Delivery Note', type: 'text', isPrimary: true },
            { id: 'batch-num-lat', label: 'رقم الدفعة (Batch Number)', exportKey: 'Batch Number', type: 'text' },
            { id: 'sut-lat', label: 'SUT (SUT)', exportKey: 'SUT', type: 'text' },
            { id: 'package-id-lat', label: 'معرف الحزمة (Package ID)', exportKey: 'Package ID', type: 'text' },
            { id: 'date-ar', label: 'التاريخ (Date)', exportKey: 'Date', type: 'date', sticky: true },
            { id: 'qty-checked-lat', label: 'الكمية المفحوصة (Qty Checked)', exportKey: 'Qty Checked', type: 'number', sticky: true, triggerCalc: true, isQtySum: true },
            { id: 'qty-reworked-lat', label: 'الكمية المعاد إصلاحها (Reworked)', exportKey: 'Qty Reworked', type: 'number' }
        ]
    }
};

const AppState = {
    missions: {},
    counters: { ok: 0, nok: 0 },
    currentMissionKey: '',
    tempImages: [],
    editingBoxId: null,
    isHeaderCollapsed: true,
    showAllHistory: false,
    isDarkMode: false,

    init() {
        this.loadFromStorage();
        this.initTheme();
        this.updateTime();
        this.runPokaYokeTimer();
        setInterval(() => this.updateTime(), 30000);
        this.setupEventListeners();
        this.populateRefHistory();

        const lastVendor = localStorage.getItem('qa_last_vendor') || 'One Tech';
        document.getElementById('vendor').value = lastVendor;
        this.handleVendorChange(lastVendor);

        // Initial Header State
        this.toggleHeader(true);
    },

    initTheme() {
        this.isDarkMode = localStorage.getItem('qa_theme') === 'dark';
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        const themeToggleImg = document.getElementById('theme-toggle-img');
        if (themeToggleImg) {
            themeToggleImg.src = this.isDarkMode ? 'media/moonIcon.png' : 'media/sunIcon.png';
        }
    },

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const theme = this.isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('qa_theme', theme);

        this.showToast(this.isDarkMode ? "الوضع الليلي مفعّل" : "الوضع المضيء مفعّل", "info");

        const themeToggleImg = document.getElementById('theme-toggle-img');
        if (themeToggleImg) {
            themeToggleImg.src = this.isDarkMode ? 'media/moonIcon.png' : 'media/sunIcon.png';
        }
    },

    populateRefHistory() {
        const savedRefs = JSON.parse(localStorage.getItem('qa_ref_history') || '[]');
        const datalist = document.getElementById('ref-history');
        if (datalist) {
            datalist.innerHTML = savedRefs.map(r => `<option value="${r}">`).join('');
        }
    },

    loadFromStorage() {
        const saved = localStorage.getItem('qa_missions_p8');
        if (saved) this.missions = JSON.parse(saved);
        const ins = localStorage.getItem('qa_inspector');
        if (ins) document.getElementById('inspector-name').value = ins;
    },

    saveToStorage() {
        localStorage.setItem('qa_missions_p8', JSON.stringify(this.missions));
        localStorage.setItem('qa_inspector', document.getElementById('inspector-name').value);
        localStorage.setItem('qa_last_vendor', document.getElementById('vendor').value);
    },

    saveDraft() {
        try {
            const draftData = {
                missions: this.missions,
                inspector: document.getElementById('inspector-name').value,
                vendor: document.getElementById('vendor').value,
                manualVendor: document.getElementById('manual-vendor-input')?.value || '',
                client: document.getElementById('client')?.value || '',
                manualClient: document.getElementById('manual-client-input')?.value || '',
                ref: document.getElementById('ref-number').value,
                part: document.getElementById('part-name').value,
                shiftFrom: document.getElementById('shift-from').value,
                shiftTo: document.getElementById('shift-to').value,
                comments: document.getElementById('comments').value,
                timestamp: new Date().toISOString()
            };

            const json = JSON.stringify(draftData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const now = new Date();
            const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
            const link = document.createElement('a');
            link.href = url;
            link.download = `Draft_Report_${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            this.showToast('تم حفظ المسودة بنجاح (Draft Saved)', 'success');
        } catch (e) {
            console.error('Save Draft Error:', e);
            this.showToast('خطأ في حفظ المسودة (Error Saving Draft)', 'danger');
        }
    },

    loadDraft(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Update State
                this.missions = data.missions || {};

                // Update UI Fields
                document.getElementById('inspector-name').value = data.inspector || '';
                document.getElementById('vendor').value = data.vendor || '';
                if (data.manualVendor) document.getElementById('manual-vendor-input').value = data.manualVendor;

                // Trigger vendor change logic to set up containers and dynamic fields
                this.handleVendorChange(data.vendor || 'One Tech');

                // Continue UI updates after vendor logic
                if (data.client) {
                    const clientSelect = document.getElementById('client');
                    if (clientSelect) clientSelect.value = data.client;
                    this.handleClientChange(data.client);
                }
                if (data.manualClient) document.getElementById('manual-client-input').value = data.manualClient;

                document.getElementById('ref-number').value = data.ref || '';
                document.getElementById('part-name').value = data.part || '';
                document.getElementById('shift-from').value = data.shiftFrom || '';
                document.getElementById('shift-to').value = data.shiftTo || '';
                document.getElementById('comments').value = data.comments || '';

                // Restore History and Summaries
                this.saveToStorage(); // Sync to localStorage
                this.switchMission(); // This will call renderScannedList and updateTotalSummary

                this.showToast('تم تحميل المسودة بنجاح (Draft Loaded)', 'success');

                // Reset file input
                event.target.value = '';
            } catch (e) {
                console.error('Load Draft Error:', e);
                this.showToast('خطأ: ملف غير صالح أو تالف', 'danger');
            }
        };
        reader.readAsText(file);
    },

    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}/${month}/${year}`;

        document.getElementById('digital-clock').textContent = timeStr;
        document.getElementById('header-date-top').textContent = dateStr;
    },

    runPokaYokeTimer() {
        const hour = new Date().getHours();
        let f, t;
        if (hour >= 6 && hour < 14) { f = "06:00"; t = "14:00"; }
        else if (hour >= 14 && hour < 22) { f = "14:00"; t = "22:00"; }
        else { f = "22:00"; t = "06:00"; }
        document.getElementById('shift-from').value = f;
        document.getElementById('shift-to').value = t;
    },

    setupEventListeners() {
        const btnSaveBox = document.getElementById('btn-save-box');
        if (btnSaveBox) btnSaveBox.addEventListener('click', () => this.handleSaveAction());

        const exportWaBtn = document.getElementById('export-wa-btn');
        if (exportWaBtn) exportWaBtn.addEventListener('click', () => ExportManager.processImageExport('whatsapp'));

        const btnShowPreview = document.getElementById('btn-show-preview');
        if (btnShowPreview) btnShowPreview.addEventListener('click', () => ExportManager.exportReportAsImage());

        document.getElementById('dynamic-fields-container').addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon')) {
                const fieldId = e.target.closest('.btn-icon').previousElementSibling.id;
                ScannerManager.openModal(fieldId);
            }
        });

        const btnDeleteAll = document.getElementById('btn-delete-all');
        if (btnDeleteAll) btnDeleteAll.addEventListener('click', () => this.deleteAllRecords());

        // Strict input rules
        document.addEventListener('input', (e) => {
            const el = e.target;
            const stringFields = ['inspector-name', 'ref-number', 'part-name', 'lot-num-lat', 'batch-num-lat', 'serial-lat', 'delivery-note-lat', 'package-id-lat', 'sut-lat', 'dyn-ref-lat', 'manual-vendor-input', 'manual-client-input', 'client'];
            if (stringFields.includes(el.id)) {
                let start = el.selectionStart;
                let end = el.selectionEnd;
                let val = el.value.toUpperCase();
                let cleanVal = el.id === 'inspector-name'
                    ? val.replace(/[^A-Z0-9\-_/.+ ]/g, '')
                    : val.replace(/[^A-Z0-9\-_/. ]/g, '');
                if (el.value !== cleanVal) {
                    el.value = cleanVal;
                    try { el.setSelectionRange(start, end); } catch (ex) { }
                } else if (el.value !== val) {
                    el.value = val;
                    try { el.setSelectionRange(start, end); } catch (ex) { }
                }
            } else if (el.type === 'number' || el.inputMode === 'numeric') {
                const cleanVal = el.value.replace(/[^0-9]/g, '');
                if (el.value !== cleanVal) el.value = cleanVal;
            }

            // Auto collapse setup section when user starts typing dynamic fields
            const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
            if (dynamicFieldsContainer && dynamicFieldsContainer.contains(el)) {
                AppState.collapseSetupSection();
            }
        });

        // Prevention of accidental data loss on page leave/refresh
        window.addEventListener('beforeunload', (event) => {
            const boxes = this.missions[this.currentMissionKey] || [];
            if (boxes.length > 0) {
                event.preventDefault();
                event.returnValue = ""; // Standard requirement for modern browsers
            }
        });
    },

    collapseSetupSection() {
        const header = document.querySelector('.setup-section');
        const icon = document.getElementById('toggle-header-icon');
        if (!header.classList.contains('collapsed')) {
            header.classList.add('collapsed');
            icon.textContent = '▼';
            icon.style.transform = 'rotate(0deg)';
            this.showToast('تم طي الإعدادات', 'info');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    toggleHeader(forceCollapse = null) {
        this.isHeaderCollapsed = forceCollapse !== null ? forceCollapse : !this.isHeaderCollapsed;
        const details = document.getElementById('header-collapsible');
        const badgeIcon = document.getElementById('badge-icon');
        const header = document.getElementById('floating-header');

        if (this.isHeaderCollapsed) {
            details.classList.add('collapsed');
            badgeIcon.textContent = '▼';
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        } else {
            details.classList.remove('collapsed');
            badgeIcon.textContent = '▲';
            header.style.boxShadow = '0 15px 45px rgba(0,0,0,0.2)';
            this.updateSummaryBadge();
        }
    },

    updateSummaryBadge() {
        let v = document.getElementById('vendor').value || 'M.S';
        if (v === 'Manual') v = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        const r = document.getElementById('ref-number').value || 'Ref';
        const p = document.getElementById('part-name').value || 'Unit';
        document.getElementById('badge-text').textContent = `${v} | ${r} | ${p}`;
    },

    handleVendorChange(val) {
        const manualVendorCtn = document.getElementById('manual-vendor-container');
        const manualClientCtn = document.getElementById('manual-client-container');
        const clientCtn = document.getElementById('client-container');

        if (val === 'Manual') {
            manualVendorCtn.style.display = 'block';
            clientCtn.style.display = 'none';
            manualClientCtn.style.display = 'block';
            this.renderDynamicFields('Manual');
        } else {
            manualVendorCtn.style.display = 'none';
            manualClientCtn.style.display = 'none';
            clientCtn.style.display = 'block';

            const config = FieldConfig[val];
            if (config) {
                clientCtn.innerHTML = `<select id="client" onchange="AppState.handleClientChange(this.value)" style="width:100%">
                    ${config.clients.map(c => `<option value="${c}">${c}</option>`).join('')}
                    <option value="Manual">يدوي...</option>
                </select>`;
                this.renderDynamicFields(val);
            }
        }
        this.switchMission();
        this.updateSummaryBadge();
    },

    handleClientChange(val) {
        const manualClientCtn = document.getElementById('manual-client-container');
        if (val === 'Manual') {
            manualClientCtn.style.display = 'block';
        } else {
            manualClientCtn.style.display = 'none';
        }
        this.switchMission();
    },

    showManualInput(type, placeholder) {
        // Obsolete UI replacement with toggle approach
    },

    revertToDropdown(type) {
        // Obsolete UI replacement with toggle approach
    },

    renderDynamicFields(vendor) {
        if (vendor === 'Manual') {
            const checkedBoxes = Array.from(document.querySelectorAll('#manual-fields-selector input:checked')).map(cb => cb.value);
            const manualFields = [];
            const fieldMappings = {
                'Etiquette': { id: 'etiquette-lat', label: 'رقم الملصق (N.Etiquette)', exportKey: 'N.Etiquette', type: 'number', isPrimary: true },
                'Lot Number': { id: 'lot-num-lat', label: 'رقم الدفعة (Lot Number)', exportKey: 'Lot Number', type: 'text' },
                'Batch Number': { id: 'batch-num-lat', label: 'رقم الدفعة (Batch Number)', exportKey: 'Batch Number', type: 'text' },
                'Serial Number': { id: 'serial-lat', label: 'الرقم التسلسلي (Serial Number)', exportKey: 'Serial Number', type: 'text', isPrimary: true },
                'Delivery Note': { id: 'delivery-note-lat', label: 'رقم الإرسالية (Delivery Note)', exportKey: 'Delivery Note', type: 'text', isPrimary: true },
                'SUT': { id: 'sut-lat', label: 'SUT (SUT)', exportKey: 'SUT', type: 'text' },
                'Package ID': { id: 'package-id-lat', label: 'معرف الحزمة (Package ID)', exportKey: 'Package ID', type: 'text' },
                'Reference': { id: 'dyn-ref-lat', label: 'مرجع (Reference)', exportKey: 'Reference', type: 'text' }
            };

            checkedBoxes.forEach(cb => {
                if (fieldMappings[cb]) manualFields.push(fieldMappings[cb]);
            });

            manualFields.push({ id: 'date-ar', label: 'تاريخ الإنتاج (Date)', exportKey: 'Date', type: 'date', sticky: true });
            manualFields.push({ id: 'qty-checked-lat', label: 'الكمية المفحوصة (Qty Checked)', exportKey: 'Qty Checked', type: 'number', sticky: true, triggerCalc: true, isQtySum: true });
            manualFields.push({ id: 'qty-reworked-lat', label: 'الكمية المعاد إصلاحها (Reworked)', exportKey: 'Qty Reworked', type: 'number' });

            FieldConfig['Manual'] = { clients: ['Manual'], fields: manualFields };
            ExportManager.vendorTableConfig['Manual'] = checkedBoxes.concat(['Date']);

            this.currentMissionKey = `Manual_Manual_${document.getElementById('ref-number').value}`;
        }

        const ctn = document.getElementById('dynamic-fields-container');
        const config = FieldConfig[vendor];
        if (!config) { ctn.innerHTML = ''; return; }

        ctn.innerHTML = config.fields.map(f => `
            <div class="input-group">
                <label for="${f.id}">${f.label}</label>
                <input type="${f.type}" ${f.type === 'number' ? 'inputmode="numeric"' : ''} id="${f.id}" placeholder="${f.label}" 
                       ${f.triggerCalc ? 'oninput="AppState.runAutoCalc()"' : ''}>
            </div>`).join('');
    },

    switchMission() {
        let v = document.getElementById('vendor').value;
        if (v === 'Manual') v = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        let c = document.getElementById('client')?.value;
        if (c === 'Manual' || document.getElementById('vendor').value === 'Manual') {
            c = document.getElementById('manual-client-input').value.trim() || 'Manual';
        }

        const r = document.getElementById('ref-number').value;
        if (!v || !c || !r) return;

        this.currentMissionKey = `${v}_${c}_${r}`;
        if (!this.missions[this.currentMissionKey]) this.missions[this.currentMissionKey] = [];
        this.renderScannedList();
        this.updateTotalSummary();
        this.updateSummaryBadge();
    },

    adjustCounter(type, val) {
        const v = document.getElementById('vendor').value;
        const qtyF = FieldConfig[v]?.fields.find(f => f.triggerCalc);
        if (!qtyF) return this.showToast('يرجى اختيار المورد أولاً', 'danger');

        const input = document.getElementById(qtyF.id);
        const current = parseInt(input.value) || 0;
        input.value = Math.max(0, current + val);
        this.runAutoCalc();
    },

    runAutoCalc() {
        const v = document.getElementById('vendor').value;
        const qtyF = FieldConfig[v]?.fields.find(f => f.triggerCalc);
        const total = parseInt(document.getElementById(qtyF.id || '')?.value) || 0;

        let nok = 0;
        document.querySelectorAll('.def-qty').forEach(i => nok += (parseInt(i.value) || 0));

        this.counters = { nok, ok: Math.max(0, total - nok) };
        document.getElementById('ok-count').textContent = String(this.counters.ok).padStart(2, '0');
        document.getElementById('nok-count').textContent = String(this.counters.nok).padStart(2, '0');
    },

    addDefectRow() {
        const ctn = document.getElementById('defect-list');
        const div = document.createElement('div');
        div.className = 'input-row';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" placeholder="نوع العيب" class="def-name" style="flex:2">
            <input type="number" value="1" class="def-qty" style="flex:1" oninput="AppState.runAutoCalc()">
            <button class="btn-minimal-link" style="color:var(--nok-red)" onclick="this.parentElement.remove(); AppState.runAutoCalc();">✕</button>
        `;
        // FLAGSHIP FEATURE: Pre-filled with 1.
        ctn.appendChild(div);
        this.runAutoCalc();
    },

    showToast(message, type = 'success') {
        const ctn = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        ctn.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    },

    flashField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.classList.add('flash-success');
        setTimeout(() => field.classList.remove('flash-success'), 1500);
    },

    async handleSaveAction() {
        const btnSaveBox = document.getElementById('btn-save-box');
        if (btnSaveBox && btnSaveBox.disabled) return;

        // Visual Debounce
        if (btnSaveBox) {
            btnSaveBox.disabled = true;
            btnSaveBox.style.opacity = '0.7';
            btnSaveBox.style.cursor = 'not-allowed';
            setTimeout(() => {
                btnSaveBox.disabled = false;
                btnSaveBox.style.opacity = '1';
                btnSaveBox.style.cursor = 'pointer';
            }, 500);
        }

        const v = document.getElementById('vendor').value;
        const primary = FieldConfig[v]?.fields.find(f => f.isPrimary);
        const primaryVal = primary ? document.getElementById(primary.id).value.trim() : null;

        let isSansGalia = false;
        if (primary && !primaryVal && !this.editingBoxId) {
            const confirmed = await ModalManager.showConfirm(
                'Sans Galia',
                'بعض المعطيات فارغة. هل تريد الحفظ كـ "Sans Galia"؟'
            );
            if (confirmed) {
                isSansGalia = true;
            } else {
                return;
            }
        }

        const data = this.captureFormData(isSansGalia);
        if (!data) return;

        const boxes = this.missions[this.currentMissionKey] || [];
        const isDup = boxes.some(b => b.id !== this.editingBoxId && !b.isSansGalia && JSON.stringify(b.dynamicData) === JSON.stringify(data.dynamicData));

        if (isDup && !this.editingBoxId) {
            return this.showToast('⚠️ خطأ: بيانات هذا الصندوق مكررة!', 'danger');
        }

        if (this.editingBoxId) {
            const idx = boxes.findIndex(b => b.id === this.editingBoxId);
            data.createdAt = boxes[idx].createdAt;
            boxes[idx] = data;
            this.showToast('تم تحديث البيانات بنجاح');
        } else {
            data.createdAt = new Date().toISOString();
            this.missions[this.currentMissionKey].push(data);
            this.showToast('تمت الإضافة للتقرير');
        }

        this.saveToStorage();
        this.smartReset();
        this.renderScannedList();
        this.updateTotalSummary();

        // Save to Reference History
        const r = document.getElementById('ref-number').value.trim().toUpperCase();
        if (r) {
            const savedRefs = JSON.parse(localStorage.getItem('qa_ref_history') || '[]');
            if (!savedRefs.includes(r)) {
                savedRefs.push(r);
                localStorage.setItem('qa_ref_history', JSON.stringify(savedRefs));
                this.populateRefHistory();
            }
        }
    },

    captureFormData(isSansGalia = false) {
        let v = document.getElementById('vendor').value;
        const rootVendor = v; // keep root vendor for FieldConfig lookup
        let c = document.getElementById('client')?.value;

        if (rootVendor === 'Manual') {
            v = document.getElementById('manual-vendor-input').value.trim() || 'Manual';
            c = document.getElementById('manual-client-input').value.trim() || 'Manual';
        } else if (c === 'Manual') {
            c = document.getElementById('manual-client-input').value.trim() || 'Manual';
        }

        const r = document.getElementById('ref-number').value;
        if (!v || !c || !r) return this.showToast('بيانات الجلسة غير مكتملة', 'danger');

        const config = FieldConfig[rootVendor];
        const data = {
            id: this.editingBoxId || Date.now(),
            inspector: document.getElementById('inspector-name').value,
            vendor: v, client: c, ref: r, part: document.getElementById('part-name').value,
            shift: { from: document.getElementById('shift-from').value, to: document.getElementById('shift-to').value },
            dynamicData: {}, ok: this.counters.ok, nok: this.counters.nok,
            defects: [], comments: document.getElementById('comments').value, images: [...this.tempImages],
            isSansGalia: isSansGalia
        };

        config.fields.forEach(f => data.dynamicData[f.exportKey] = document.getElementById(f.id).value);
        document.querySelectorAll('.def-name').forEach((inp, idx) => {
            const qty = parseInt(document.querySelectorAll('.def-qty')[idx].value) || 0;
            if (inp.value && qty > 0) data.defects.push({ name: inp.value, qty });
        });
        return data;
    },

    smartReset() {
        const v = document.getElementById('vendor').value;
        const primary = FieldConfig[v]?.fields.find(f => f.isPrimary);
        if (primary) document.getElementById(primary.id).value = '';

        document.getElementById('defect-list').innerHTML = '';
        document.getElementById('comments').value = '';
        document.getElementById('image-preview').innerHTML = '';
        this.tempImages = [];
        this.counters = { ok: 0, nok: 0 };
        this.runAutoCalc();

        this.editingBoxId = null;
        const addBtn = document.getElementById('btn-save-box');
        if (addBtn) {
            addBtn.innerHTML = '<img src="media/saveIcon.png" class="custom-icon" alt="Save"> حفظ الصندوق';
            addBtn.style.background = '';
        }
    },

    renderScannedList() {
        const list = document.getElementById('scanned-list');
        const boxes = this.missions[this.currentMissionKey] || [];
        if (boxes.length === 0) return list.innerHTML = '<div class="empty-state">لا توجد بيانات </div>';

        const display = this.showAllHistory ? [...boxes] : [...boxes].slice(-5);
        list.innerHTML = display.map((box, idx) => `
            <div class="grid-row ${box.nok > 0 ? 'card-danger' : ''}">
                <span class="grid-col">${idx + 1}</span>
                <span class="grid-col">${box.ref}</span>
                <span class="grid-col">${Object.values(box.dynamicData)[0]}</span>
                <span class="grid-col">${box.dynamicData['Lot Number'] || box.dynamicData['Batch Number'] || '-'}</span>
                <span class="grid-col" style="color:var(--accent); font-weight:700;">${box.ok}</span>
                <span class="grid-col" style="color:var(--nok-red); font-weight:700;">${box.nok}</span>
                <span class="grid-col">${box.reworked || 0}</span>
                <div class="grid-col action-col">
                    <button class="action-btn" onclick="AppState.editRecord(${box.id})">✏️</button>
                    <button class="action-btn" style="color:var(--nok-red)" onclick="AppState.deleteRecord(${box.id})">🗑️</button>
                </div>
            </div>`).join('');
    },

    toggleHistoryDisplay() {
        this.showAllHistory = !this.showAllHistory;
        document.getElementById('toggle-list-btn').innerHTML = this.showAllHistory ? 'عرض الحديث ‹' : 'عرض الكل ›';
        this.renderScannedList();
    },

    editRecord(id) {
        const boxes = this.missions[this.currentMissionKey];
        const box = boxes.find(b => b.id === id);
        this.editingBoxId = id;
        document.getElementById('part-name').value = box.part;
        document.getElementById('comments').value = box.comments;
        const config = FieldConfig[box.vendor];
        config.fields.forEach(f => document.getElementById(f.id).value = box.dynamicData[f.exportKey]);

        const dlist = document.getElementById('defect-list');
        dlist.innerHTML = box.defects.map(d => `
            <div class="input-row" style="margin-bottom:10px;">
                <input type="text" class="def-name" value="${d.name}" style="flex:2">
                <input type="number" class="def-qty" value="${d.qty}" style="flex:1" oninput="AppState.runAutoCalc()">
                <button class="btn-minimal-link" style="color:var(--nok-red)" onclick="this.parentElement.remove(); AppState.runAutoCalc();">✕</button>
            </div>`).join('');

        this.runAutoCalc();
        const addBtn = document.getElementById('btn-save-box');
        if (addBtn) {
            addBtn.innerHTML = '<img src="media/saveIcon.png" class="custom-icon" alt="Save"> تحديث الصندوق';
            addBtn.style.background = 'var(--primary-blue)';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.toggleHeader(false);
    },

    async deleteRecord(id) {
        const confirmed = await ModalManager.showConfirm(
            'حذف',
            'هل أنت متأكد من حذف هذا السجل؟'
        );
        if (!confirmed) return;
        this.missions[this.currentMissionKey] = this.missions[this.currentMissionKey].filter(b => b.id !== id);
        this.saveToStorage();
        this.renderScannedList();
        this.updateTotalSummary();
        this.showToast('تم الحذف بنجاح', 'info');
    },

    async deleteAllRecords() {
        if (!this.missions[this.currentMissionKey] || this.missions[this.currentMissionKey].length === 0) {
            return this.showToast('لا توجد سجلات لحذفها', 'info');
        }

        const confirmed = await ModalManager.showConfirm(
            'حذف الكل',
            'هل أنت متأكد من حذف جميع السجلات؟'
        );
        if (!confirmed) return;

        this.missions[this.currentMissionKey] = [];
        this.saveToStorage();
        this.smartReset();
        this.renderScannedList();
        this.updateTotalSummary();
        this.showToast('تم حذف جميع السجلات', 'danger');
    },

    updateTotalSummary() {
        const boxes = this.missions[this.currentMissionKey] || [];
        const total = boxes.reduce((s, b) => {
            const qtyStr = b.dynamicData['Qty Checked'] || b.dynamicData['الكمية المفحوصة (Qty Checked)'] || b.dynamicData['الكمية المفحوصة (Qty Checked)'] || 0;
            const parsed = parseInt(qtyStr) || 0;
            // Fallback for cases where 'Qty Checked' label isn't reliably parsed:
            return s + (parsed > 0 ? parsed : ((parseInt(b.ok) || 0) + (parseInt(b.nok) || 0)));
        }, 0);
        document.getElementById('total-qty-val').textContent = total;
    },

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        const preview = document.getElementById('image-preview');
        files.forEach(f => {
            const rd = new FileReader();
            rd.onload = (ev) => {
                const imgData = ev.target.result;
                this.tempImages.push(imgData);

                // Create container for image and delete button
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';
                imgContainer.style.display = 'inline-block';

                const img = document.createElement('img');
                img.src = imgData;
                img.style.height = '60px';
                img.style.borderRadius = '8px';

                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-photo-btn hide-on-export data-html2canvas-ignore';
                deleteBtn.innerHTML = '×';
                deleteBtn.onclick = () => {
                    imgContainer.remove();
                    this.tempImages = this.tempImages.filter(src => src !== imgData);
                };

                imgContainer.appendChild(img);
                imgContainer.appendChild(deleteBtn);
                preview.appendChild(imgContainer);
            };
            rd.readAsDataURL(f);
        });
        e.target.value = ''; // Reset to allow same file selection
    },

    handleReferenceChange() {
        const r = document.getElementById('ref-number').value.toUpperCase();
        if (REF_MAP[r]) {
            document.getElementById('part-name').value = REF_MAP[r];
            AppState.flashField('part-name');
        }
        this.switchMission();
    },

    triggerPrimaryScanner() {
        const v = document.getElementById('vendor').value;
        const primary = FieldConfig[v]?.fields.find(f => f.isPrimary);
        if (!primary) return this.showToast('Select a vendor first', 'info');
        ScannerManager.openModal(primary.id);
    }
};

const ModalManager = {
    showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const msgEl = document.getElementById('confirm-msg');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            titleEl.textContent = title;
            msgEl.textContent = message;
            modal.style.display = 'flex';

            const handleResponse = (result) => {
                modal.style.display = 'none';
                yesBtn.onclick = null;
                noBtn.onclick = null;
                resolve(result);
            };

            yesBtn.onclick = () => handleResponse(true);
            noBtn.onclick = () => handleResponse(false);
            modal.onclick = (e) => { if (e.target === modal) handleResponse(false); };
        });
    }
};

const ParserManager = {
    // Legacy patterns for fallback or manual entry refinement if needed
    patterns: {
        ref: /PAE\d+/i,
        date: /\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/,
    },

    /**
     * SmartDistributor: Vendor-specific parsing logic
     */
    smartDistributor(text) {
        console.group("🚀 SMART DISTRIBUTOR");
        console.log("Scanned Text:", text);

        const vendor = document.getElementById('vendor').value;
        const config = FieldConfig[vendor];
        let primaryFieldId = config?.fields.find(f => f.isPrimary)?.id;
        let matchedSomething = false;

        // Utility to check duplicates
        const checkDuplicate = (val, fieldKey) => {
            const boxes = AppState.missions[AppState.currentMissionKey] || [];
            return boxes.some(b => b.dynamicData[fieldKey] === val);
        };

        const handleDuplicate = (val) => {
            if (window.navigator?.vibrate) window.navigator.vibrate([200, 100, 200]);
            AppState.showToast('هذا الملصق ممسوح مسبقاً!', 'danger');
            // We don't clear the field, just alert.
        };

        // VENDOR LOGIC: One Tech
        if (vendor === 'One Tech') {
            const parts = text.split('@');
            let batchData = { lot: '', qty: '', label: '' };
            let hasS = false;

            parts.forEach(p => {
                const part = p.trim();
                // Ignore 30S (Reference is manual)
                if (part.startsWith('H')) batchData.lot = part.substring(1);
                else if (part.startsWith('Q')) batchData.qty = part.substring(1);
                else if (part.startsWith('S')) {
                    batchData.label = part.substring(1);
                    hasS = true;
                }
            });

            // Duplicate Check on 'S' (Serial)
            if (hasS && checkDuplicate(batchData.label, 'N.Etiquette')) {
                handleDuplicate(batchData.label);
                console.groupEnd();
                return; // Stop processing
            }

            // Populate Fields (Excluding Reference)
            if (batchData.lot) {
                document.getElementById('lot-num-lat').value = batchData.lot;
                AppState.flashField('lot-num-lat');
                matchedSomething = true;
            }
            if (batchData.qty) {
                document.getElementById('qty-checked-lat').value = batchData.qty;
                AppState.flashField('qty-checked-lat');
                AppState.runAutoCalc();
                matchedSomething = true;
            }
            if (batchData.label) {
                document.getElementById('etiquette-lat').value = batchData.label;
                AppState.flashField('etiquette-lat');
                matchedSomething = true;
            }

            console.groupEnd();

            if (matchedSomething) {
                AppState.playBeep();
                AppState.switchMission();
                // Auto-close ONLY if these 3 specific fields are filled
                if (batchData.lot && batchData.qty && batchData.label) {
                    setTimeout(() => ScannerManager.closeModal(), 600);
                }
            } else {
                AppState.showToast('Unknown sequence', 'info');
            }
            return; // Exit One Tech block early
        }

        // VENDOR LOGIC: Martur Fompak
        else if (vendor === 'Martur Fompak') {
            const snMatch = text.match(/\b\d{10}\b/); // 10-digit numeric
            const batchMatch = text.match(/\bM\w+\b/i); // Starts with M

            if (snMatch) {
                const val = snMatch[0];
                if (checkDuplicate(val, 'Serial Number')) {
                    handleDuplicate(val);
                } else {
                    document.getElementById('serial-lat').value = val;
                    AppState.flashField('serial-lat');
                    matchedSomething = true;
                }
            }
            if (batchMatch) {
                document.getElementById('batch-num-lat').value = batchMatch[0];
                AppState.flashField('batch-num-lat');
                matchedSomething = true;
            }
        }

        // VENDOR LOGIC: Voltaira or Gentherm
        else if (vendor === 'Voltaira' || vendor === 'Gentherm Vietnam') {
            const val = text.trim();
            // Prefix-based auto-fill
            if (val.startsWith('PKG') || val.startsWith('P')) {
                const targetId = vendor === 'Voltaira' ? 'package-id-lat' : 'delivery-note-lat';
                const field = document.getElementById(targetId);
                if (field) {
                    if (checkDuplicate(val, vendor === 'Voltaira' ? 'Package ID' : 'Delivery Note')) {
                        handleDuplicate(val);
                    } else {
                        field.value = val;
                        AppState.flashField(targetId);
                        matchedSomething = true;
                    }
                }
            } else if (val.startsWith('DN') || val.startsWith('L')) {
                const targetId = 'delivery-note-lat';
                const field = document.getElementById(targetId);
                if (field) {
                    if (checkDuplicate(val, 'Delivery Note')) {
                        handleDuplicate(val);
                    } else {
                        field.value = val;
                        AppState.flashField(targetId);
                        matchedSomething = true;
                    }
                }
            } else {
                // Default to primary if no prefix matches
                const field = document.getElementById(primaryFieldId);
                if (field) {
                    if (checkDuplicate(val, config.fields.find(f => f.isPrimary).exportKey)) {
                        handleDuplicate(val);
                    } else {
                        field.value = val;
                        AppState.flashField(primaryFieldId);
                        matchedSomething = true;
                    }
                }
            }
        }

        console.groupEnd();

        if (matchedSomething) {
            AppState.playBeep();
            AppState.switchMission();
            // Auto-close ONLY if primary field is filled
            const primaryVal = document.getElementById(primaryFieldId)?.value;
            if (primaryVal) {
                setTimeout(() => ScannerManager.closeModal(), 500);
            }
        } else {
            AppState.showToast('Unknown format', 'info');
        }
    },

    formatDate(dateStr) {
        if (!dateStr) return null;
        // Clean the string of anything not a digit or common separator
        const cleanStr = dateStr.replace(/[^\d\/\.-]/g, '');
        const parts = cleanStr.split(/[\/\.-]/);

        if (parts.length === 3) {
            let day, month, year;

            // Handle YYYY-MM-DD (standard HTML5 date input) or DD-MM-YYYY
            if (parts[0].length === 4) {
                [year, month, day] = parts;
            } else if (parts[2].length === 4) {
                [day, month, year] = parts;
            } else if (parts[2].length === 2) {
                [day, month, year] = parts;
                year = "20" + year;
            } else {
                return cleanStr; // Fallback
            }

            // Pad and validate
            const d = day.padStart(2, '0');
            const m = month.padStart(2, '0');
            const y = year;

            // Basic sanity check to prevent "2012/02/2026" type concatenation
            if (d.length === 2 && m.length === 2 && y.length === 4) {
                return `${d}/${m}/${y}`;
            }
        }
        return cleanStr;
    }
};

const ScannerManager = {
    scanner: null,
    targetFieldId: null,

    async openModal(fieldId) {
        this.targetFieldId = fieldId;
        const modal = document.getElementById('scanner-modal');
        modal.style.display = 'flex';

        if (!this.scanner) {
            this.scanner = new Html5Qrcode("reader");
        }

        const config = {
            fps: 20,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        try {
            await this.scanner.start(
                { facingMode: "environment" },
                config,
                (text) => ParserManager.smartDistributor(text)
            );
            document.getElementById('scanner-status').textContent = "Scanning active...";
        } catch (err) {
            AppState.showToast('Camera Error: ' + err, 'danger');
            this.closeModal();
        }
    },

    async closeModal() {
        const modal = document.getElementById('scanner-modal');
        modal.style.display = 'none';
        if (this.scanner) {
            try {
                await this.scanner.stop();
            } catch (e) { console.warn("Scanner stop failed", e); }
        }
    }
};

// Add Audio Utility to AppState
AppState.playBeep = function () {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) { console.error("Audio error", e); }
};

const ExportManager = {
    vendorTableConfig: {
        "One Tech": ["N.Etiquette", "Lot Number", "Date"],
        "Martur Fompak": ["Serial Number", "Batch Number", "Date"],
        "Gentherm Vietnam": ["Delivery Note", "Batch Number", "Date"],
        "Voltaira": ["Delivery Note", "Batch Number", "SUT", "Package ID", "Date"],
        "Default": ["Reference", "Batch Number", "Date"]
    },

    chunkArray(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    },

    async generatePDF() {
        try {
            const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
            if (!jsPDF) {
                console.error("jsPDF library not found");
                return AppState.showToast('تعذر تحميل مكتبة PDF', 'danger');
            }

            const boxes = AppState.missions[AppState.currentMissionKey];
            if (!boxes || boxes.length === 0) return AppState.showToast('لا توجد بيانات', 'info');

            const doc = new jsPDF('l', 'mm', 'a4');

            let vendor = document.getElementById('vendor').value;
            let vendorDisplay = vendor;
            if (vendor === 'Manual') vendorDisplay = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

            let client = document.getElementById('client')?.value || '-';
            let clientDisplay = client;
            if (client === 'Manual' || vendor === 'Manual') {
                clientDisplay = document.getElementById('manual-client-input').value.trim() || 'Manual';
            }

            const ref = document.getElementById('ref-number').value || '-';
            const inspector = document.getElementById('inspector-name').value || '-';
            const part = document.getElementById('part-name').value || '-';
            const dateStr = new Date().toLocaleDateString('en-GB');
            const shift = `${document.getElementById('shift-from').value} - ${document.getElementById('shift-to').value}`;

            const chunks = this.chunkArray(boxes, 21);
            const dataKeys = this.vendorTableConfig[vendor] || this.vendorTableConfig["Default"];

            const uniqueDefectsSet = new Set();
            boxes.forEach(box => box.defects.forEach(d => uniqueDefectsSet.add(d.name)));
            const uniqueDefects = Array.from(uniqueDefectsSet);

            const headers = [
                'N°', ...dataKeys.map(k => this.getBilingualHeader(k)),
                'Qté OK', 'Qté NOK', 'Retouché', ...uniqueDefects
            ];

            chunks.forEach((chunk, pageIdx) => {
                if (pageIdx > 0) doc.addPage();

                // Header Info
                doc.setFontSize(10);
                doc.text(`Date: ${dateStr}`, 14, 15);
                doc.text(`Shift: ${shift}`, 14, 20);
                doc.text(`Inspector: ${inspector}`, 14, 25);
                doc.text(`Vendor: ${vendorDisplay}`, 140, 15);
                doc.text(`Client: ${clientDisplay}`, 140, 20);
                doc.text(`Reference: ${ref}`, 140, 25);
                doc.setFontSize(14);
                doc.text("RAPPORT D'INSPECTION - AB SERVE", 110, 10);

                const tableData = chunk.map((box, idx) => {
                    const row = [(pageIdx * 21) + idx + 1];

                    if (box.isSansGalia) {
                        row.push({ content: 'Sans Galia', colSpan: dataKeys.length, styles: { halign: 'center', fontStyle: 'bold' } });
                    } else {
                        dataKeys.forEach(key => {
                            let val = box.dynamicData[key] || '';
                            if (key.toLowerCase().includes('date') && val) val = ParserManager.formatDate(val) || val;
                            row.push(val);
                        });
                    }

                    row.push(box.ok + box.nok, box.nok, box.reworked || 0);
                    uniqueDefects.forEach(dName => {
                        const found = box.defects.find(d => d.name === dName);
                        row.push(found ? found.qty : '');
                    });
                    return row;
                });

                if (typeof doc.autoTable !== 'function') {
                    throw new Error("jsPDF-AutoTable plugin not loaded correctly");
                }

                doc.autoTable({
                    startY: 30,
                    head: [headers],
                    body: tableData,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                    headStyles: { fillGray: 200, textColor: 0, fontStyle: 'bold' },
                    didParseCell: function (data) {
                        if (data.section === 'body' && data.column.index >= (1 + dataKeys.length + 1) && data.cell.text[0] !== '') {
                            data.cell.styles.fillColor = [254, 226, 226]; // NOK red light
                        }
                    }
                });
            });

            // Dedicated Media Page
            const allImages = boxes.reduce((acc, b) => acc.concat(b.images || []), []).concat(AppState.tempImages);
            const commentsInput = document.getElementById('comments').value;
            const allComments = boxes.map(b => b.comments).filter(c => c && c.trim() !== '');
            const hasComments = (commentsInput && commentsInput.trim() !== '') || allComments.length > 0;

            if (allImages.length > 0 || hasComments) {
                doc.addPage();
                doc.setFontSize(14);
                doc.text("MEDIA & COMMENTS", 14, 15);

                let currentY = 25;
                if (hasComments) {
                    doc.setFontSize(10);
                    const finalComments = commentsInput || allComments.join(' | ');
                    doc.text("Comments:", 14, currentY);
                    currentY += 5;
                    const splitText = doc.splitTextToSize(finalComments, 260);
                    doc.text(splitText, 14, currentY);
                    currentY += (splitText.length * 5) + 10;
                }

                if (allImages.length > 0) {
                    doc.text("Photos / Evidence:", 14, currentY);
                    currentY += 10;
                    let x = 14;
                    for (const imgData of allImages) {
                        if (x > 250) { x = 14; currentY += 50; }
                        if (currentY > 230) { doc.addPage(); currentY = 20; x = 14; }
                        try {
                            const format = imgData.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
                            doc.addImage(imgData, format, x, currentY, 40, 40, undefined, 'FAST');
                        } catch (e) {
                            console.warn("Failed to add image to PDF", e);
                        }
                        x += 45;
                    }
                }
            }

            doc.save(`Report_ABServe_${vendorDisplay}_${dateStr.replace(/\//g, '-')}.pdf`);
            AppState.showToast('تم حفظ ملف PDF بنجاح', 'success');
        } catch (err) {
            console.error("PDF Export Error:", err);
            AppState.showToast('خطأ أثناء إنشاء ملف PDF', 'danger');
        }
    },

    async exportReportAsImage() {
        await this.processImageExport('preview');
    },

    async processImageExport(mode) {
        const boxes = AppState.missions[AppState.currentMissionKey];
        if (!boxes || boxes.length === 0) return AppState.showToast('لا توجد بيانات', 'info');

        const commentsInput = document.getElementById('comments').value;
        const allComments = boxes.map(b => b.comments).filter(c => c && c.trim() !== '');
        const hasComments = (commentsInput && commentsInput.trim() !== '') || allComments.length > 0;
        const allImages = boxes.reduce((acc, b) => acc.concat(b.images || []), []).concat(AppState.tempImages);
        const hasPhotos = allImages.length > 0;

        const limit = (hasPhotos || hasComments) ? 15 : 30;
        const chunks = this.chunkArray(boxes, limit);

        let vendor = document.getElementById('vendor').value;
        let vendorDisplay = vendor;
        if (vendor === 'Manual') vendorDisplay = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        const dateStr = new Date().toLocaleDateString('en-GB');
        const fileArray = [];

        AppState.showToast('جاري تحضير التقرير...', 'info');

        for (let i = 0; i < chunks.length; i++) {
            const isLastChunk = (i === chunks.length - 1);
            const blob = await this.captureChunkAsBlob(chunks[i], i, chunks.length, isLastChunk);
            const filename = `Report_Part_${i + 1}.png`;

            if (mode === 'preview' && chunks.length === 1) {
                const canvas = await this.blobToCanvas(blob);
                this.showPreview(canvas, vendor, dateStr);
                this.renderAllBoxesToDOM(boxes);
                return;
            }

            const file = new File([blob], filename, { type: 'image/png' });
            fileArray.push(file);

            if (mode === 'download' || (mode === 'preview' && chunks.length > 1)) {
                this.downloadBlob(blob, filename);
            }
        }

        this.renderAllBoxesToDOM(boxes);

        if (mode === 'whatsapp') {
            await this.executeWhatsAppShare(fileArray);
        } else if (chunks.length > 1) {
            AppState.showToast('تم تحميل أجزاء التقرير بنجاح', 'success');
        }
    },

    async captureChunkAsBlob(chunk, index, totalChunks, isLastChunk) {
        const uniqueDefectsSet = new Set();
        const allBoxes = AppState.missions[AppState.currentMissionKey];
        allBoxes.forEach(box => box.defects.forEach(d => uniqueDefectsSet.add(d.name)));
        const uniqueDefects = Array.from(uniqueDefectsSet);

        this.setupReportBasics(allBoxes, uniqueDefects);
        this.renderSpecificRows(chunk, uniqueDefects, index * chunk.length);

        const reportFooter = document.querySelector('.rep-footer');
        const commentsSection = document.querySelector('.rep-footer-top');
        const evidenceSection = document.querySelector('.rep-evidence-section');

        if (isLastChunk) {
            reportFooter.style.display = 'block';
            const commentsInput = document.getElementById('comments').value;
            const allComments = allBoxes.map(b => b.comments).filter(c => c && c.trim() !== '');
            const hasAnyComments = (commentsInput && commentsInput.trim() !== '') || allComments.length > 0;
            commentsSection.style.display = hasAnyComments ? 'block' : 'none';
            if (hasAnyComments) document.getElementById('rep-comments-val').textContent = commentsInput || allComments.join(' | ');

            const allImages = allBoxes.reduce((acc, b) => acc.concat(b.images || []), []).concat(AppState.tempImages);
            evidenceSection.style.display = allImages.length > 0 ? 'block' : 'none';
            if (allImages.length > 0) {
                const gallery = document.getElementById('rep-gallery');
                gallery.innerHTML = '';
                allImages.forEach(imgData => {
                    const img = document.createElement('img');
                    img.src = imgData;
                    img.style.height = '60px';
                    img.style.borderRadius = '8px';
                    img.style.margin = '5px';
                    gallery.appendChild(img);
                });
            }
        } else {
            reportFooter.style.display = 'none';
        }

        const templateTag = document.getElementById('final-report-template');
        templateTag.style.position = 'absolute';
        templateTag.style.left = '-9999px';
        templateTag.style.top = '0';
        templateTag.style.visibility = 'visible';

        try {
            await this.waitForImages(templateTag);
            const canvas = await html2canvas(templateTag, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                windowWidth: 1600,
                windowHeight: templateTag.scrollHeight
            });
            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } finally {
            templateTag.style.visibility = 'hidden';
            templateTag.style.top = '-9999px';
        }
    },

    async executeWhatsAppShare(fileArray) {
        let vendor = document.getElementById('vendor').value;
        let vendorDisplay = vendor;
        if (vendor === 'Manual') vendorDisplay = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        let client = document.getElementById('client')?.value;
        let clientDisplay = client;
        if (client === 'Manual' || vendor === 'Manual') {
            clientDisplay = document.getElementById('manual-client-input').value.trim() || 'Manual';
        }

        const designation = document.getElementById('part-name')?.value || '';
        const dateStr = new Date().toLocaleDateString('en-GB');
        const shiftFrom = document.getElementById('shift-from')?.value || '';
        const shiftTo = document.getElementById('shift-to')?.value || '';
        const waText = `Mission: ${vendorDisplay}\nClient: ${clientDisplay}\nName: ${designation}\nDate: ${dateStr}\nShift: ${shiftFrom} - ${shiftTo}`;

        if (navigator.share && navigator.canShare && navigator.canShare({ files: fileArray })) {
            try {
                await navigator.share({
                    files: fileArray,
                    title: 'QA Report',
                    text: waText
                });
                AppState.playBeep();
            } catch (err) {
                console.error("WhatsApp Multi-Share Error:", err);
                AppState.showToast('فشل في مشاركة الملفات', 'danger');
            }
        } else {
            AppState.showToast('المتصفح لا يدعم مشاركة الملفات المتعددة', 'warning');
            // Fallback: download all
            fileArray.forEach(file => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
    },

    blobToCanvas(blob) {
        return new Promise(resolve => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(canvas);
            };
            img.src = url;
        });
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    renderAllBoxesToDOM(boxes) {
        const uniqueDefectsSet = new Set();
        boxes.forEach(box => box.defects.forEach(d => uniqueDefectsSet.add(d.name)));
        const uniqueDefects = Array.from(uniqueDefectsSet);
        this.setupReportBasics(boxes, uniqueDefects);
        this.renderSpecificRows(boxes, uniqueDefects, 0);
        document.querySelector('.rep-footer').style.display = 'block';
    },

    setupReportBasics(boxes, uniqueDefects) {
        let vendor = document.getElementById('vendor').value;
        const rootVendor = vendor;
        let vendorDisplay = vendor;
        if (vendor === 'Manual') vendorDisplay = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        let client = document.getElementById('client')?.value || '-';
        let clientDisplay = client;
        if (client === 'Manual' || vendor === 'Manual') {
            clientDisplay = document.getElementById('manual-client-input').value.trim() || 'Manual';
        }

        const ref = document.getElementById('ref-number').value || '-';
        const inspector = document.getElementById('inspector-name').value || '-';
        const part = document.getElementById('part-name').value || '-';
        const dateStr = new Date().toLocaleDateString('en-GB');

        document.getElementById('rep-date-val').textContent = dateStr;
        document.getElementById('rep-shift-start').textContent = document.getElementById('shift-from').value;
        document.getElementById('rep-shift-end').textContent = document.getElementById('shift-to').value;
        document.getElementById('rep-inspector-val').textContent = inspector;
        document.getElementById('rep-client-val').textContent = clientDisplay;
        document.getElementById('rep-vendor-val').textContent = vendorDisplay;
        document.getElementById('rep-ref-val').textContent = ref;
        document.getElementById('rep-part-val').textContent = part;

        const dataKeys = this.vendorTableConfig[rootVendor] || this.vendorTableConfig["Default"];
        const leftCount = 1 + dataKeys.length + 3;
        const rightCount = uniqueDefects.length;
        const totalCount = leftCount + rightCount;

        const headerService = document.getElementById('rep-header-service');
        const headerDefects = document.getElementById('rep-header-defects');
        headerService.style.flex = `0 0 ${(leftCount / totalCount) * 100}%`;
        headerService.textContent = 'DÉTAILS DE LA PRESTATION / SERVICE DETAILS:';
        headerService.style.borderRight = "1px solid #000";

        if (rightCount > 0) {
            headerDefects.style.flex = `0 0 ${(rightCount / totalCount) * 100}%`;
            headerDefects.textContent = 'LISTE DES DÉFAUTS / LIST OF DEFECTS';
            headerDefects.style.display = '';
        } else {
            headerDefects.style.display = 'none';
        }

        const subHeaderRow = document.getElementById('rep-sub-header-row');
        subHeaderRow.innerHTML = '';
        const subHeaders = [
            'N°', ...dataKeys.map(k => this.getBilingualHeader(k)),
            'Qté triée\nChecked', 'Qté NOK', 'Qté retouchée\nReworked',
            ...uniqueDefects
        ];
        subHeaders.forEach(sh => {
            const div = document.createElement('div');
            div.className = 'rep-header-col';
            div.textContent = sh;
            subHeaderRow.appendChild(div);
        });
    },

    renderSpecificRows(chunkRows, uniqueDefects, offset) {
        const vendor = document.getElementById('vendor').value;
        const dataKeys = this.vendorTableConfig[vendor] || this.vendorTableConfig["Default"];
        const totalCount = 1 + dataKeys.length + 3 + uniqueDefects.length;
        const rowsContainer = document.getElementById('rep-rows-container');
        rowsContainer.innerHTML = '';

        chunkRows.forEach((box, idx) => {
            const row = document.createElement('div');
            row.className = 'rep-row';
            const nCol = document.createElement('div');
            nCol.className = 'rep-col';
            nCol.textContent = offset + idx + 1;
            row.appendChild(nCol);

            if (box.isSansGalia) {
                const sgCell = document.createElement('div');
                sgCell.className = 'sans-galia-cell';
                sgCell.style.flex = `0 0 ${(dataKeys.length / totalCount) * 100}%`;
                const sgInner = document.createElement('div');
                sgInner.className = 'sans-galia-inner';
                sgInner.textContent = 'Sans Galia';
                sgCell.appendChild(sgInner);
                row.appendChild(sgCell);
            } else {
                dataKeys.forEach(key => {
                    const col = document.createElement('div');
                    col.className = 'rep-col';
                    let val = box.dynamicData[key] || '';
                    if (key.toLowerCase().includes('date') && val) val = ParserManager.formatDate(val) || val;
                    col.textContent = val;
                    row.appendChild(col);
                });
            }

            [box.ok + box.nok, box.nok, box.reworked || 0].forEach(val => {
                const col = document.createElement('div');
                col.className = 'rep-col';
                col.textContent = val;
                row.appendChild(col);
            });

            uniqueDefects.forEach(defect => {
                const col = document.createElement('div');
                col.className = 'rep-col';
                const dMatch = box.defects.find(d => d.name === defect);
                col.textContent = dMatch ? dMatch.qty : '';
                if (dMatch) col.style.backgroundColor = '#fee2e2';
                row.appendChild(col);
            });
            rowsContainer.appendChild(row);
        });
    },

    waitForImages(container) {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = img.onerror = resolve;
            });
        });
        return Promise.all(promises);
    },

    showPreview(canvas, vendor, dateStr) {
        const modal = document.getElementById('export-preview-modal');
        const container = document.getElementById('preview-image-container');
        container.innerHTML = '';

        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        container.appendChild(img);

        modal.style.display = 'flex';

        // Setup Button Handlers
        document.getElementById('preview-edit-btn').onclick = () => {
            modal.style.display = 'none';
        };

        const pdfBtn = document.getElementById('preview-pdf-btn');
        if (pdfBtn) {
            pdfBtn.onclick = () => {
                modal.style.display = 'none';
                this.generatePDF();
            };
        }

        const imgBtn = document.getElementById('preview-img-btn');
        if (imgBtn) {
            imgBtn.onclick = () => {
                this.finalizeExport(canvas, vendor, dateStr);
                modal.style.display = 'none';
            };
        }

        document.getElementById('preview-wa-btn').onclick = () => {
            modal.style.display = 'none';
            this.processImageExport('whatsapp');
        };
    },

    async finalizeExport(canvas, vendor, dateStr) {
        let vendorDisplay = vendor;
        if (vendor === 'Manual') vendorDisplay = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        const dateFilename = dateStr.replace(/\//g, '-');
        const filename = `Report_ABServe_${vendorDisplay}_${dateFilename}.png`;

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], filename, { type: 'image/png' });

            if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                try {
                    await navigator.share({ files: [file], title: 'QA Report' });
                    AppState.playBeep();
                } catch (shareErr) {
                    if (shareErr.name !== 'AbortError') {
                        this.downloadImage(canvas, filename);
                        AppState.playBeep();
                    }
                }
            } else {
                this.downloadImage(canvas, filename);
                AppState.playBeep();
            }
        } catch (err) {
            console.error("Finalize Export Error:", err);
            AppState.showToast('خطأ أثناء الحفظ', 'danger');
        }
    },

    downloadImage(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        AppState.showToast('تم حفظ الصورة بنجاح');
    },

    getBilingualHeader(key) {
        const map = {
            "N.Etiquette": "N.Etiquette / Label",
            "Lot Number": "N° Lot / Lot Number",
            "Batch Number": "N° Lot / Batch Number",
            "Date": "Date",
            "Serial Number": "N° Série / Serial Number",
            "Delivery Note": "BL / Delivery Note",
            "SUT": "SUT / SUT",
            "Package ID": "ID Colis / Package ID",
            "Reference": "Référence / Reference"
        };
        return map[key] || key;
    }
}

document.addEventListener('DOMContentLoaded', () => AppState.init());
