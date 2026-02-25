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

    triggerPrimaryOCR() {
        const v = document.getElementById('vendor').value;
        const primary = FieldConfig[v]?.fields.find(f => f.isPrimary);
        if (!primary) return this.showToast('Select a vendor first', 'info');
        ScannerManager.openModal(primary.id);
    }
};

const ParserManager = {
    patterns: {
        ref: /PAE\d+/i,
        date: /\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/,
        etiquette: /(?:Etiquette|Etiquetto|No|Nr)[\s\S]{0,30}?(\d{2,6})/i,
        qty: /(?:Quantite|Qty|Quantit|Qte)[\s\S]{0,30}?(\d{1,5})/i,
        generic3: /\b(\d{3})\b/
    },

    distribute(text) {
        // Diagnostic Logging
        console.group("🚀 SMART OCR PARSER");
        console.log("Raw OCR Result:", text);

        let matchedSomething = false;
        const v = document.getElementById('vendor').value;
        const config = FieldConfig[v];

        // 1. Reference (Ref #)
        const refMatch = text.match(this.patterns.ref);
        if (refMatch) {
            const val = refMatch[0].toUpperCase();
            console.log("✅ Matched Reference:", val);
            document.getElementById('ref-number').value = val;
            AppState.flashField('ref-number');
            AppState.switchMission();
            matchedSomething = true;
        }

        // 2. Date
        const dateMatch = text.match(this.patterns.date);
        if (dateMatch) {
            const formatted = this.formatDateForInput(dateMatch[0]);
            if (formatted) {
                console.log("✅ Matched Date:", formatted);
                const dateField = document.getElementById('date-ar');
                if (dateField) {
                    dateField.value = formatted;
                    AppState.flashField('date-ar');
                    matchedSomething = true;
                }
            }
        }

        // 3. Quantity (Qty Checked) - Priority over lone 3-digit numbers
        const qtyMatch = text.match(this.patterns.qty);
        if (qtyMatch) {
            const val = qtyMatch[1];
            console.log("✅ Matched Quantity:", val);
            const qtyField = config?.fields.find(f => f.isQtySum);
            if (qtyField) {
                document.getElementById(qtyField.id).value = val;
                AppState.flashField(qtyField.id);
                AppState.runAutoCalc();
                matchedSomething = true;
            }
        }

        // 4. N.Etiquette / Label Number
        let etiMatch = text.match(this.patterns.etiquette);
        let etiValue = etiMatch ? etiMatch[1] : null;

        if (!etiValue) {
            // Standalone 3-digit fallback only if not already used for Qty
            const fallMatch = text.match(this.patterns.generic3);
            if (fallMatch && (!matchedSomething || !text.includes(fallMatch[0]))) {
                etiValue = fallMatch[1];
            }
        }

        if (etiValue) {
            console.log("✅ Matched Etiquette:", etiValue);
            const etiField = config?.fields.find(f => f.id.includes('etiquette') || f.id.includes('serial') || f.isPrimary);
            if (etiField) {
                document.getElementById(etiField.id).value = etiValue;
                AppState.flashField(etiField.id);
                matchedSomething = true;
            }
        }

        console.groupEnd();

        if (!matchedSomething) {
            AppState.showToast('No patterns found. Enter manually.', 'info');
        } else {
            AppState.showToast('Data distributed successfully');
        }
    },

    formatDateForInput(dateStr) {
        const parts = dateStr.split(/[\/\.-]/);
        if (parts.length === 3) {
            // Standardize to DD/MM/YYYY or similar
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            let y = parts[2];
            if (y.length === 2) y = "20" + y; // Assume 20xx for YY
            return `${y}-${m}-${d}`;
        }
        return null;
    }
};

const ScannerManager = {
    stream: null,
    targetFieldId: null,

    async openModal(fieldId) {
        this.targetFieldId = fieldId;
        const modal = document.getElementById('ocr-modal');
        modal.style.display = 'flex';
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            document.getElementById('ocr-video').srcObject = this.stream;
        } catch (err) {
            AppState.showToast('Camera Error: ' + err.message, 'danger');
            this.closeModal();
        }
    },

    closeModal() {
        const modal = document.getElementById('ocr-modal');
        modal.style.display = 'none';
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    },

    async capture() {
        const video = document.getElementById('ocr-video');
        const spinner = document.getElementById('ocr-loading');
        const canvas = document.getElementById('ocr-canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        spinner.style.display = 'flex';
        try {
            const result = await Tesseract.recognize(canvas, 'eng');
            const txt = result.data.text.trim();
            if (txt) {
                ParserManager.distribute(txt);
                this.closeModal();
            } else {
                AppState.showToast('Reading failed, try again', 'danger');
            }
        } catch (e) { AppState.showToast('OCR Error', 'danger'); }
        finally { spinner.style.display = 'none'; }
    }
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
