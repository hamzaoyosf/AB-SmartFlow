/**
 * AB Serve - QA Tracker Flagship Logic (Phase 8)
 */

const FieldConfig = {
    'One Tech': {
        clients: ['Marelli', 'OP Mobility'],
        fields: [
            { id: 'etiquette-lat', label: 'رقم الملصق (N.Etiquette)', exportKey: 'N.Etiquette', type: 'text', isPrimary: true },
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

        const lastVendor = localStorage.getItem('qa_last_vendor') || 'One Tech';
        document.getElementById('vendor').value = lastVendor;
        this.handleVendorChange(lastVendor);

        // Initial Header State
        this.toggleHeader(true);
    },

    initTheme() {
        this.isDarkMode = localStorage.getItem('qa_theme') === 'dark';
        if (this.isDarkMode) document.body.classList.add('dark-mode');
    },

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('qa_theme', this.isDarkMode ? 'dark' : 'light');
        this.showToast(this.isDarkMode ? "الوضع الليلي مفعّل" : "الوضع المضيء مفعّل", "info");
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
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
        document.getElementById('defects-images').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('add-to-report').addEventListener('click', () => this.handleSaveAction());
        document.getElementById('gen-img').addEventListener('click', () => ExportManager.exportReportAsImage());
        document.getElementById('gen-pdf').addEventListener('click', () => ExportManager.generatePDF());
        document.getElementById('share-whatsapp').addEventListener('click', () => ExportManager.shareWhatsApp());

        document.getElementById('dynamic-fields-container').addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon')) {
                const fieldId = e.target.closest('.btn-icon').previousElementSibling.id;
                ScannerManager.openModal(fieldId);
            }
        });
    },

    toggleHeader(forceCollapse = null) {
        this.isHeaderCollapsed = forceCollapse !== null ? forceCollapse : !this.isHeaderCollapsed;
        const details = document.getElementById('header-collapsible');
        const badgeIcon = document.getElementById('badge-icon');
        const header = document.getElementById('floating-header');

        if (this.isHeaderCollapsed) {
            details.classList.remove('expanded');
            badgeIcon.textContent = '▼';
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        } else {
            details.classList.add('expanded');
            badgeIcon.textContent = '▲';
            header.style.boxShadow = '0 15px 45px rgba(0,0,0,0.2)';
            this.updateSummaryBadge();
        }
    },

    updateSummaryBadge() {
        const v = document.getElementById('vendor').value || 'M.S';
        const r = document.getElementById('ref-number').value || 'Ref';
        const p = document.getElementById('part-name').value || 'Unit';
        document.getElementById('badge-text').textContent = `${v} | ${r} | ${p}`;
    },

    handleVendorChange(val) {
        if (val === 'Other') {
            this.showManualInput('vendor', 'اسم المورد');
        } else {
            const config = FieldConfig[val];
            if (config) {
                const ctn = document.getElementById('client-container');
                ctn.innerHTML = `<select id="client" onchange="AppState.switchMission()" style="width:100%">
                    ${config.clients.map(c => `<option value="${c}">${c}</option>`).join('')}
                    <option value="Other">يدوي...</option>
                </select>`;
                this.renderDynamicFields(val);
            }
            this.switchMission();
        }
        this.updateSummaryBadge();
    },

    showManualInput(type, placeholder) {
        const container = document.getElementById(`${type}-container`);
        container.innerHTML = `
            <div style="display:flex; gap:8px; width:100%;">
                <input type="text" id="${type}" placeholder="${placeholder}">
                <button class="btn-minimal-link" style="white-space:nowrap; color: var(--nok-red)" onclick="AppState.revertToDropdown('${type}')">✕</button>
            </div>
        `;
    },

    revertToDropdown(type) {
        const container = document.getElementById(`${type}-container`);
        if (type === 'vendor') {
            container.innerHTML = `
                <select id="vendor" onchange="AppState.handleVendorChange(this.value)">
                    <option value="">Select Vendor...</option>
                    <option value="One Tech">One Tech</option>
                    <option value="Martur Fompak">Martur Fompak</option>
                    <option value="Gentherm Vietnam">Gentherm Vietnam</option>
                    <option value="Voltaira">Voltaira</option>
                    <option value="Other">يدوي...</option>
                </select>`;
        } else {
            container.innerHTML = `<input type="text" id="client" placeholder="Client Name">`;
        }
    },

    renderDynamicFields(vendor) {
        const ctn = document.getElementById('dynamic-fields-container');
        const config = FieldConfig[vendor];
        ctn.innerHTML = config.fields.map(f => `
            <div class="input-group">
                <label for="${f.id}">${f.label}</label>
                <input type="${f.type}" id="${f.id}" placeholder="${f.label}" 
                       ${f.triggerCalc ? 'oninput="AppState.runAutoCalc()"' : ''}>
            </div>`).join('');
    },

    switchMission() {
        const v = document.getElementById('vendor').value;
        const c = document.getElementById('client')?.value;
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
    },

    captureFormData(isSansGalia = false) {
        const v = document.getElementById('vendor').value;
        const c = document.getElementById('client')?.value;
        const r = document.getElementById('ref-number').value;
        if (!v || !c || !r) return this.showToast('بيانات الجلسة غير مكتملة', 'danger');

        const config = FieldConfig[v];
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
        document.getElementById('add-to-report').textContent = 'حفظ التقرير (Save Record)';
        document.getElementById('add-to-report').className = 'btn btn-success full-width';
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
        document.getElementById('add-to-report').textContent = 'UPDATE RECORD';
        document.getElementById('add-to-report').className = 'btn btn-primary full-width';
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
        const v = document.getElementById('vendor').value;
        const key = FieldConfig[v]?.fields.find(f => f.isQtySum)?.exportKey;
        const total = boxes.reduce((s, b) => s + (parseInt(b.dynamicData[key]) || 0), 0);
        document.getElementById('total-qty-val').textContent = total;
    },

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        const preview = document.getElementById('image-preview');
        preview.innerHTML = '';
        this.tempImages = [];
        files.forEach(f => {
            const rd = new FileReader();
            rd.onload = (ev) => {
                const img = document.createElement('img');
                img.src = ev.target.result; img.style.height = '60px'; img.style.borderRadius = '8px';
                preview.appendChild(img);
                this.tempImages.push(ev.target.result);
            };
            rd.readAsDataURL(f);
        });
    },

    handleReferenceChange() {
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
        const parts = dateStr.split(/[\/\.-]/);
        if (parts.length === 3) {
            let d = parts[0].padStart(2, '0');
            let m = parts[1].padStart(2, '0');
            let y = parts[2];
            if (y.length === 2) y = "20" + y;
            // Handle DD-MM-YYYY to YYYY-MM-DD
            if (parseInt(d) > 31) { // Swap if year is first
                [d, y] = [y, d];
            }
            return `${y}-${m}-${d}`;
        }
        return null;
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

        const vendor = document.getElementById('vendor').value;
        const client = document.getElementById('client')?.value || '-';
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

        const dataKeys = this.vendorTableConfig[vendor] || this.vendorTableConfig["Default"];
        const dataColCount = dataKeys.length;
        const defectColCount = uniqueDefects.length;

        // Dynamic Grid Template: N° column (40px) + Data Cols + Quantities + Defects
        const template = `40px repeat(${dataColCount}, 1fr) 60px 60px 75px ${defectColCount > 0 ? `repeat(${defectColCount}, 45px)` : ''}`;
        const templateTag = document.getElementById('final-report-template');
        templateTag.style.setProperty('--grid-columns-template', template);

        const totalPixelsEstimate = 40 + (dataColCount * 120) + 195 + (defectColCount * 45);
        const dataPixels = 40 + (dataColCount * 120) + 195;
        const dataSectionPercent = (dataPixels / totalPixelsEstimate) * 100;
        templateTag.style.setProperty('--data-section-width', `${dataSectionPercent}%`);
        templateTag.style.setProperty('--defect-section-width', `${100 - dataSectionPercent}%`);

        // Ensure "List of defects" only shows if there are defect columns
        const defectHeaderTitle = document.querySelector('.header-main-title:last-child');
        if (defectHeaderTitle) {
            defectHeaderTitle.style.display = defectColCount > 0 ? 'flex' : 'none';
        }

        // 4. INJECT HEADERS
        const headerContainer = document.getElementById('rep-dynamic-column-headers');
        headerContainer.innerHTML = '';

        // N° Header
        const nDiv = document.createElement('div');
        nDiv.textContent = 'N°';
        headerContainer.appendChild(nDiv);

        // Data Headers (Bilingual Mapping)
        const bilingualHeaderMap = {
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

        dataKeys.forEach(key => {
            const div = document.createElement('div');
            div.textContent = bilingualHeaderMap[key] || key;
            headerContainer.appendChild(div);
        });

        const qtyHeaders = [
            { fr: 'Qté triée', en: 'Checked' },
            { fr: 'Qté NOK', en: '' },
            { fr: 'Qté retouchée', en: 'Reworked' }
        ];
        qtyHeaders.forEach(h => {
            const div = document.createElement('div');
            div.innerHTML = h.en ? `${h.fr}<br>${h.en}` : h.fr;
            headerContainer.appendChild(div);
        });

        uniqueDefects.forEach(defect => {
            const div = document.createElement('div');
            div.textContent = defect;
            div.style.fontSize = '8px';
            headerContainer.appendChild(div);
        });

        // 5. INJECT ROWS
        const rowsContainer = document.getElementById('rep-grid-rows-container');
        rowsContainer.innerHTML = '';
        boxes.forEach((box, idx) => {
            const row = document.createElement('div');
            row.className = `rep-grid-row ${box.isSansGalia ? 'sans-galia' : ''}`;

            if (box.isSansGalia) {
                // N° Cell
                const nCell = document.createElement('div');
                nCell.textContent = idx + 1;
                row.appendChild(nCell);

                // Container for Merged Sans Galia (to keep black border-right)
                const container = document.createElement('div');
                container.style.gridColumn = `span ${dataColCount}`;
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.padding = '0';

                const blueBox = document.createElement('div');
                blueBox.className = 'merged-data-cell';
                blueBox.style.width = 'calc(100% - 12px)';
                blueBox.style.height = 'calc(100% - 6px)';
                blueBox.textContent = 'Sans Galia';
                container.appendChild(blueBox);
                row.appendChild(container);
            } else {
                // N° Cell
                const nCell = document.createElement('div');
                nCell.textContent = idx + 1;
                row.appendChild(nCell);

                // Data Cells
                dataKeys.forEach(key => {
                    const div = document.createElement('div');
                    let val = box.dynamicData[key] || '';
                    if (key.toLowerCase().includes('date') && val && val.includes('-')) {
                        const parts = val.split('-');
                        if (parts.length === 3) val = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    div.textContent = val;
                    row.appendChild(div);
                });
            }

            // Qty Cells (Shared for both modes)
            [box.ok + box.nok, box.nok, box.reworked || 0].forEach(val => {
                const div = document.createElement('div');
                div.textContent = val;
                row.appendChild(div);
            });

            // Defect Matrix
            uniqueDefects.forEach(defect => {
                const div = document.createElement('div');
                const dMatch = box.defects.find(d => d.name === defect);
                div.textContent = dMatch ? dMatch.qty : '';
                if (dMatch) div.style.backgroundColor = '#fee2e2';
                row.appendChild(div);
            });
            rowsContainer.appendChild(row);
        });

        // 6. FOOTER & GALLERY (Conditional Visibility)
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
            const imagesToRender = AppState.tempImages.length > 0 ? AppState.tempImages : allImages;
            imagesToRender.forEach(imgData => {
                const img = document.createElement('img');
                img.src = imgData;
                img.crossOrigin = "anonymous";
                gallery.appendChild(img);
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
                windowWidth: 1200,
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
    }
}

document.addEventListener('DOMContentLoaded', () => AppState.init());
