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

    handleSaveAction() {
        const data = this.captureFormData();
        if (!data) return;

        const boxes = this.missions[this.currentMissionKey] || [];
        const isDup = boxes.some(b => b.id !== this.editingBoxId && JSON.stringify(b.dynamicData) === JSON.stringify(data.dynamicData));

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

    captureFormData() {
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
            defects: [], comments: document.getElementById('comments').value, images: [...this.tempImages]
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

        const display = this.showAllHistory ? [...boxes].reverse() : [...boxes].slice(-3).reverse();
        list.innerHTML = display.map(box => `
            <div class="history-card ${box.nok > 0 ? 'card-danger' : ''}">
                <div class="header-row">
                    <div style="font-weight:700; font-family:'Inter'; color:var(--primary-blue);">${Object.values(box.dynamicData)[0]}</div>
                    <div style="display:flex; gap:8px;">
                        <span class="badge badge-ok">OK: ${box.ok}</span>
                        ${box.nok > 0 ? `<span class="badge card-badge-nok">NOK: ${box.nok}</span>` : ''}
                    </div>
                </div>
                <div style="font-size:0.8rem; margin:8px 0; opacity:0.7;">
                    ${box.part} | Ref: ${box.ref}
                </div>
                <div class="card-actions">
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

    deleteRecord(id) {
        if (!confirm('حذف هذا السجل؟')) return;
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
    generatePDF() {
        const boxes = AppState.missions[AppState.currentMissionKey];
        if (!boxes || boxes.length === 0) return AppState.showToast('No Data', 'info');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`QA REPORT - ${boxes[0].vendor}`, 105, 15, { align: 'center' });
        doc.autoTable({
            startY: 25,
            head: [['ID', 'OK', 'NOK']],
            body: boxes.map(b => [Object.values(b.dynamicData)[0], b.ok, b.nok])
        });
        doc.save(`QA_Report.pdf`);
        AppState.showToast('تم إعداد التقرير بنجاح (PDF Ready)');
    },
    shareWhatsApp() {
        const boxes = AppState.missions[AppState.currentMissionKey];
        if (!boxes || boxes.length === 0) return;
        let msg = `*QA Log*\n*Vendor:* ${boxes[0].vendor}\n---\n`;
        boxes.forEach(b => msg += `📦 ${Object.values(b.dynamicData)[0]} - OK: ${b.ok}\n`);
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    }
}

document.addEventListener('DOMContentLoaded', () => AppState.init());
