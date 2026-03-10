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
        if (this.isDarkMode) document.body.classList.add('dark-mode');
        const themeToggleImg = document.getElementById('theme-toggle-img');
        if (themeToggleImg) {
            if (document.body.classList.contains('dark-mode')) {
                themeToggleImg.src = 'media/moonIcon.png';
            } else {
                themeToggleImg.src = 'media/sunIcon.png';
            }
        }
    },

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('qa_theme', this.isDarkMode ? 'dark' : 'light');
        this.showToast(this.isDarkMode ? "الوضع الليلي مفعّل" : "الوضع المضيء مفعّل", "info");
        const themeToggleImg = document.getElementById('theme-toggle-img');
        if (themeToggleImg) {
            if (document.body.classList.contains('dark-mode')) {
                themeToggleImg.src = 'media/moonIcon.png';
            } else {
                themeToggleImg.src = 'media/sunIcon.png';
            }
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

        const exportImgBtn = document.getElementById('export-img-btn');
        if (exportImgBtn) exportImgBtn.addEventListener('click', () => ExportManager.exportReportAsImage());

        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => ExportManager.generatePDF());

        document.getElementById('dynamic-fields-container').addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon')) {
                const fieldId = e.target.closest('.btn-icon').previousElementSibling.id;
                ScannerManager.openModal(fieldId);
            }
        });

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
    },

    collapseSetupSection() {
        const header = document.querySelector('.setup-section');
        const icon = document.getElementById('toggle-header-icon');
        if (!header.classList.contains('collapsed')) {
            header.classList.add('collapsed');
            icon.textContent = '▼';
            icon.style.transform = 'rotate(0deg)';
            this.showToast('تم طي الإعدادات (Header Collapsed)', 'info');

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
        if (!qtyF) return this.showToast('يرجى اختيار مورد أولاً', 'danger');

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
        let c = document.getElementById('client')?.value;
        const rootVendor = v; // keep root vendor for FieldConfig lookup

        if (v === 'Manual') v = document.getElementById('manual-vendor-input').value.trim() || 'Manual';
        if (c === 'Manual' || rootVendor === 'Manual') c = document.getElementById('manual-client-input').value.trim() || 'Manual';

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
            addBtn.innerHTML = '<img src="media/saveIcon.png" class="custom-icon" alt="Save"> حفظ الصندوق (Save)';
            addBtn.style.background = '';
        }
    },

    renderScannedList() {
        const list = document.getElementById('scanned-list');
        const boxes = this.missions[this.currentMissionKey] || [];
        if (boxes.length === 0) return list.innerHTML = '<div class="empty-state">لا توجد بيانات (No Data Found)</div>';

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
        document.getElementById('toggle-list-btn').innerHTML = this.showAllHistory ? 'عرض الحديث (RECENT) ‹' : 'عرض الكل (VIEW ALL) ›';
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
            addBtn.innerHTML = '<img src="media/saveIcon.png" class="custom-icon" alt="Save"> تحديث الصندوق (Update)';
            addBtn.style.background = 'var(--primary-blue)';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.toggleHeader(false);
    },

    async deleteRecord(id) {
        const confirmed = await ModalManager.showConfirm(
            'حذف (Delete)',
            'هل أنت متأكد من حذف هذا السجل؟\n(Are you sure you want to delete this record?)'
        );
        if (!confirmed) return;
        this.missions[this.currentMissionKey] = this.missions[this.currentMissionKey].filter(b => b.id !== id);
        this.saveToStorage();
        this.renderScannedList();
        this.updateTotalSummary();
        this.showToast('تم الحذف بنجاح', 'info');
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
        const parts = dateStr.split(/[\/\.-]/);
        if (parts.length === 3) {
            let p1 = parts[0].padStart(2, '0');
            let p2 = parts[1].padStart(2, '0');
            let p3 = parts[2];

            if (p3.length === 2) p3 = "20" + p3;
            if (p1.length === 4) { // It's YYYY-MM-DD
                return `${p3}/${p2}/${p1}`;
            }
            if (parseInt(p1) > 31) { // Same check as above
                return `${p3}/${p2}/${p1}`;
            }
            // If already DD-MM-YYYY
            return `${p1}/${p2}/${p3}`;
        }
        return dateStr;
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

    async exportReportAsImage() {
        const boxes = AppState.missions[AppState.currentMissionKey];
        if (!boxes || boxes.length === 0) return AppState.showToast('لا توجد بيانات (No Data)', 'info');

        let vendor = document.getElementById('vendor').value;
        const rootVendor = vendor; // keep for config mapping
        if (vendor === 'Manual') vendor = document.getElementById('manual-vendor-input').value.trim() || 'Manual';

        let client = document.getElementById('client')?.value || '-';
        if (client === 'Manual' || rootVendor === 'Manual') {
            client = document.getElementById('manual-client-input').value.trim() || '-';
        }

        const ref = document.getElementById('ref-number').value || '-';
        const inspector = document.getElementById('inspector-name').value || '-';
        const part = document.getElementById('part-name').value || '-';
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB');

        // 1. POPULATE TEMPLATE (HIDDEN)
        document.getElementById('rep-date-val').textContent = dateStr;
        document.getElementById('rep-shift-start').textContent = document.getElementById('shift-from').value;
        document.getElementById('rep-shift-end').textContent = document.getElementById('shift-to').value;
        document.getElementById('rep-inspector-val').textContent = inspector;
        document.getElementById('rep-client-val').textContent = client;
        document.getElementById('rep-vendor-val').textContent = vendor;
        document.getElementById('rep-ref-val').textContent = ref;
        document.getElementById('rep-part-val').textContent = part;

        const uniqueDefectsSet = new Set();
        boxes.forEach(box => box.defects.forEach(d => uniqueDefectsSet.add(d.name)));
        const uniqueDefects = Array.from(uniqueDefectsSet);

        const dataKeys = this.vendorTableConfig[rootVendor] || this.vendorTableConfig["Default"];
        const dataColCount = dataKeys.length;
        const defectColCount = uniqueDefects.length;
        const templateTag = document.getElementById('final-report-template');

        // Total left column count: N° + data cols + 3 qty cols
        const leftCount = 1 + dataColCount + 3;
        const rightCount = defectColCount;
        const totalCount = leftCount + rightCount;

        // 2. APPLY DYNAMIC FLEX TO TOP CATEGORY HEADERS
        const headerService = document.getElementById('rep-header-service');
        const headerDefects = document.getElementById('rep-header-defects');

        headerService.style.flex = `0 0 ${(leftCount / totalCount) * 100}%`;
        headerService.textContent = 'DÉTAILS DE LA PRESTATION / SERVICE DETAILS:';
        // The vertical border is explicitly handled 
        headerService.style.borderRight = "1px solid #000";

        if (rightCount > 0) {
            headerDefects.style.flex = `0 0 ${(rightCount / totalCount) * 100}%`;
            headerDefects.textContent = 'LISTE DES DÉFAUTS / LIST OF DEFECTS';
            headerDefects.style.display = '';
        } else {
            headerDefects.style.display = 'none';
        }

        // 3. BUILD SUB-HEADER ROW
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

        // 3. BUILD TABLE BODY
        // 4. BUILD DATA ROWS (FLEX)
        const rowsContainer = document.getElementById('rep-rows-container');
        rowsContainer.innerHTML = '';

        boxes.forEach((box, idx) => {
            const row = document.createElement('div');
            row.className = 'rep-row';

            // N° Cell
            const nCol = document.createElement('div');
            nCol.className = 'rep-col';
            nCol.textContent = idx + 1;
            row.appendChild(nCol);

            if (box.isSansGalia) {
                // Span ONLY the data columns (N° is already drawn)
                const sgCell = document.createElement('div');
                sgCell.className = 'sans-galia-cell';
                sgCell.style.flex = `0 0 ${(dataColCount / totalCount) * 100}%`; // Absolute percentage

                const sgInner = document.createElement('div');
                sgInner.className = 'sans-galia-inner';
                sgInner.textContent = 'Sans Galia';
                sgCell.appendChild(sgInner);
                row.appendChild(sgCell);
            } else {
                // dataKeys iteration for normal rows
                dataKeys.forEach(key => {
                    const col = document.createElement('div');
                    col.className = 'rep-col';
                    let val = box.dynamicData[key] || '';
                    if (key.toLowerCase().includes('date') && val) {
                        val = ParserManager.formatDate(val) || val;
                    }
                    col.textContent = val;
                    row.appendChild(col);
                });
            }
            // Qty cells
            [box.ok + box.nok, box.nok, box.reworked || 0].forEach(val => {
                const col = document.createElement('div');
                col.className = 'rep-col';
                col.textContent = val;
                row.appendChild(col);
            });

            // Defect matrix
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

        // 4. FOOTER & GALLERY (Conditional Visibility)
        const commentsInput = document.getElementById('comments').value;
        const allComments = boxes.map(b => b.comments).filter(c => c && c.trim() !== '');
        const hasAnyComments = (commentsInput && commentsInput.trim() !== '') || allComments.length > 0;

        const allImages = boxes.reduce((acc, b) => acc.concat(b.images || []), []);
        const hasAnyImages = AppState.tempImages.length > 0 || allImages.length > 0;

        const commentsSection = document.querySelector('.rep-footer-top');
        const commentsVal = document.getElementById('rep-comments-val');
        if (hasAnyComments) {
            commentsSection.style.display = 'block';
            commentsVal.textContent = commentsInput || allComments.join(' | ');
        } else {
            commentsSection.style.display = 'none';
        }

        const evidenceSection = document.querySelector('.rep-evidence-section');
        const gallery = document.getElementById('rep-gallery');
        gallery.innerHTML = '';
        if (hasAnyImages) {
            evidenceSection.style.display = 'block';
            gallery.innerHTML = ''; // Start clean for export
            const imagesToRender = AppState.tempImages.length > 0 ? AppState.tempImages : allImages;
            imagesToRender.forEach(imgData => {
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';
                imgContainer.style.display = 'inline-block';

                const img = document.createElement('img');
                img.src = imgData;
                img.crossOrigin = "anonymous";
                img.style.height = '60px';
                img.style.borderRadius = '8px';

                // Add Delete button only if previewing currently
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-photo-btn hide-on-export';
                deleteBtn.setAttribute('data-html2canvas-ignore', 'true');
                deleteBtn.innerHTML = '×';
                deleteBtn.onclick = () => {
                    imgContainer.remove();
                    AppState.tempImages = AppState.tempImages.filter(src => src !== imgData);

                    // Remove across all boxes globally if it came from historic saves
                    AppState.missions[AppState.currentMissionKey].forEach(box => {
                        if (box.images) {
                            box.images = box.images.filter(src => src !== imgData);
                        }
                    });
                    AppState.saveToStorage();
                };

                imgContainer.appendChild(img);
                imgContainer.appendChild(deleteBtn);
                gallery.appendChild(imgContainer);
            });
        } else {
            evidenceSection.style.display = 'none';
        }

        // Hide entire footer if both are empty
        const reportFooter = document.querySelector('.rep-footer');
        reportFooter.style.display = (hasAnyComments || hasAnyImages) ? 'block' : 'none';

        // 2. CAPTURE FOR PREVIEW
        AppState.showToast('جاري تحضير المعاينة (Preparing Preview)...', 'info');

        // Ensure template is rendered but keeps its off-screen position
        templateTag.style.position = 'absolute';
        templateTag.style.left = '-9999px';
        templateTag.style.top = '0';
        templateTag.style.visibility = 'visible';

        try {
            // Wait for all images in the template to load before capture
            await this.waitForImages(templateTag);

            const canvas = await html2canvas(templateTag, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: true, // Enabled for debugging as requested
                useCORS: true,
                allowTaint: true,
                windowWidth: 1600, // Sufficient for wide reports with many columns
                windowHeight: templateTag.scrollHeight
            });

            templateTag.style.visibility = 'hidden';
            templateTag.style.top = '-9999px';

            this.showPreview(canvas, vendor, dateStr);
        } catch (err) {
            console.error("Preview Error:", err);
            AppState.showToast('خطأ أثناء تحضير المعاينة', 'danger');
            templateTag.style.visibility = 'hidden';
            templateTag.style.top = '-9999px';
        }
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

        document.getElementById('preview-save-btn').onclick = () => {
            this.finalizeExport(canvas, vendor, dateStr);
            modal.style.display = 'none';
        };

        document.getElementById('preview-wa-btn').onclick = async () => {
            // Build structured message
            const designation = document.getElementById('part-name')?.value || '';
            const shiftFrom = document.getElementById('shift-from')?.value || '';
            const shiftTo = document.getElementById('shift-to')?.value || '';

            const waText = `Mission: ${vendor}\nName: ${designation}\nDate: ${dateStr}\nShift: ${shiftFrom} - ${shiftTo}`;

            try {
                // Ensure delete buttons are hidden before snapshot
                document.querySelectorAll('.hide-on-export').forEach(el => el.style.display = 'none');

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const file = new File([blob], 'QA_Report.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'QA Report',
                        text: waText
                    });
                    AppState.playBeep();
                } else if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    // Try without canShare just in case
                    await navigator.share({
                        files: [file],
                        title: 'QA Report',
                        text: waText
                    });
                    AppState.playBeep();
                } else {
                    throw new Error("Sharing not supported");
                }
            } catch (err) {
                console.error("WhatsApp Share Error:", err);
                if (err.name !== 'AbortError') {
                    AppState.showToast('تعذر المشاركة المباشرة، تم حفظ الصورة لترفقها يدوياً', 'info');

                    // Fallback to manual download
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'QA_Report.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    // Open WhatsApp manually
                    setTimeout(() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                    }, 500);
                }
            } finally {
                // Restore delete buttons
                document.querySelectorAll('.hide-on-export').forEach(el => el.style.display = '');
            }
        };
    },

    async finalizeExport(canvas, vendor, dateStr) {
        const dateFilename = dateStr.replace(/\//g, '-');
        const filename = `Report_ABServe_${vendor}_${dateFilename}.png`;

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
        AppState.showToast('تم حفظ الصورة بنجاح (Image Saved)');
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
