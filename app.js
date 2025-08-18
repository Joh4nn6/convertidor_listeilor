/**
 * @file app.js
 * @description Lógica principal para la aplicación Conversor Universal Premium.
 */

const App = {
    config: { debounceTimeout: 300 },
    elements: {},
    debounceTimer: null,

    init() {
        this.cacheDOMElements();
        this.addEventListeners();
        this.checkDependencies();
        this.showInitialContent();
    },

    cacheDOMElements() {
        this.elements = {
            loader: document.getElementById('loader'),
            editor: document.getElementById('editor'),
            preview: document.getElementById('preview'),
            fileInput: document.getElementById('file-input'),
            marginInput: document.getElementById('margin-input'),
            tocToggle: document.getElementById('toc-toggle'),
            headerText: document.getElementById('header-text'),
            footerText: document.getElementById('footer-text'),
            buttons: {
                pdf: document.getElementById('btn-pdf'),
                docx: document.getElementById('btn-docx'),
                png: document.getElementById('btn-png'),
                txt: document.getElementById('btn-txt'),
                md: document.getElementById('btn-md'),
                clear: document.getElementById('btn-clear'),
            }
        };
    },
    
    checkDependencies() {
        if (typeof marked === 'undefined' || typeof html2pdf === 'undefined') {
            this.elements.preview.innerHTML = `<div style="color:red;padding:1rem;">Error: No se pudieron cargar las librerías externas.</div>`;
        } else {
             this.elements.loader.classList.add('hidden');
        }
    },

    addEventListeners() {
        this.elements.editor.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.renderPreview(), this.config.debounceTimeout);
        });
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        for (const key in this.elements.buttons) {
             this.elements.buttons[key].addEventListener('click', (e) => this.handleButtonClick(e, key));
        }
    },
    
    showInitialContent(){
        this.elements.editor.value = `# ¡Bienvenido al Conversor Universal Premium!\n\n## Nuevas Funciones\n\n- **Tabla de Contenidos Automática:** Actívala arriba.\n- **Encabezados y Pies de Página:** Personalízalos para tu PDF.`;
        this.renderPreview();
    },

    renderPreview() {
        const rawText = this.elements.editor.value;
        const textWithoutCites = rawText.replace(/filecite.*?|\/g, '');
        const cleanText = this.stripFrontMatter(textWithoutCites);
        const dirtyHtml = marked.parse(cleanText);
        const safeHtml = this.sanitizeHTML(dirtyHtml);
        this.elements.preview.innerHTML = safeHtml;
    },

    stripFrontMatter(text) { return text.replace(/^---\s*[\s\S]*?---\s*/, '').trim(); },

    sanitizeHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('script, iframe').forEach(el => el.remove());
        tempDiv.querySelectorAll('*').forEach(el => {
            for (const attr of el.attributes) {
                if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
            }
        });
        return tempDiv.innerHTML;
    },

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.editor.value = e.target.result;
            this.renderPreview();
        };
        reader.readAsText(file);
    },
    
    async handleButtonClick(e, type) {
        const button = e.currentTarget;
        this.setButtonBusy(button, true);
        try {
            switch (type) {
                case 'pdf':   await this.exportPDF(); break;
                // ... (otras exportaciones siguen igual)
                case 'docx':  await this.exportDOCX(); break;
                case 'png':   await this.exportPNG(); break;
                case 'txt':   this.exportTXT(); break;
                case 'md':    this.exportMD(); break;
                case 'clear': this.elements.editor.value = ''; this.renderPreview(); break;
            }
        } catch (error) {
            console.error(`Error al exportar a ${type}:`, error);
            alert(`Ocurrió un error durante la exportación a ${type.toUpperCase()}.`);
        } finally {
            if (type !== 'clear') this.setButtonBusy(button, false);
        }
    },
    
    setButtonBusy(button, isBusy) {
        const textEl = button.querySelector('.btn-text');
        const spinnerEl = button.querySelector('.spinner');
        const originalText = textEl.dataset.originalText || textEl.textContent;
        if (!textEl.dataset.originalText) textEl.dataset.originalText = originalText;

        button.disabled = isBusy;
        textEl.textContent = isBusy ? 'Generando...' : originalText;
        spinnerEl.classList.toggle('hidden', !isBusy);
    },

    getCleanTextForExport() {
         const textWithoutCites = this.elements.editor.value.replace(/filecite.*?|\/g, '');
         return this.stripFrontMatter(textWithoutCites);
    },

    getFileName() { return `documento-${new Date().toISOString().slice(0, 10)}`; },
    
    /**
     * @returns {string} HTML de la Tabla de Contenidos.
     */
    generateTOC() {
        const headings = this.elements.preview.querySelectorAll('h1, h2, h3');
        if (headings.length < 2) return '';

        let tocHtml = '<nav class="toc"><div class="toc-title">Tabla de Contenidos</div><ul>';
        headings.forEach((h, index) => {
            const level = parseInt(h.tagName.substring(1));
            const id = `toc-heading-${index}`;
            h.id = id;
            tocHtml += `<li style="margin-left: ${(level - 1) * 20}px;"><a href="#${id}">${h.textContent}</a></li>`;
        });
        tocHtml += '</ul></nav>';
        return tocHtml;
    },

    async exportPDF() {
        const margin = parseFloat(this.elements.marginInput.value || 20) / 25.4; // Convertir mm a pulgadas
        
        // Clonar el contenido para no modificar la vista previa real
        const contentClone = this.elements.preview.cloneNode(true);
        
        // Generar y añadir TOC si está activado
        if (this.elements.tocToggle.checked) {
            const toc = this.generateTOC(); // Esto añade IDs a los headings originales, así que lo hacemos sobre la vista real
            const tocNode = document.createElement('div');
            tocNode.innerHTML = toc;
            contentClone.insertBefore(tocNode, contentClone.firstChild);
        }

        // --- Lógica para Header y Footer ---
        const headerText = this.elements.headerText.value;
        const footerText = this.elements.footerText.value; // ej. "Pág. {page}/{pages}"

        const options = {
            margin: margin,
            filename: `${this.getFileName()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            // Función para añadir header y footer a cada página
            didDrawPage: function(data) {
                if (headerText) {
                    data.doc.setFontSize(10);
                    data.doc.text(headerText, data.settings.margin.left, 0.5);
                }
                if (footerText) {
                    let str = footerText.replace('{page}', data.pageNumber).replace('{pages}', data.doc.internal.getNumberOfPages());
                    data.doc.setFontSize(10);
                    data.doc.text(str, data.settings.margin.left, data.doc.internal.pageSize.height - 0.5);
                }
            }
        };
        
        // Es necesario usar un worker para que la función didDrawPage funcione correctamente con el total de páginas
        await html2pdf().from(contentClone).set(options).save();
    },

    // (El resto de funciones de exportación: docx, png, txt, md... se mantienen igual)
    async exportDOCX() {
        const cleanText = this.getCleanTextForExport();
        const paragraphs = cleanText.split('\n').map(line => new docx.Paragraph({ children: [new docx.TextRun(line)] }));
        const doc = new docx.Document({ sections: [{ children: paragraphs }] });
        const blob = await docx.Packer.toBlob(doc);
        saveAs(blob, `${this.getFileName()}.docx`);
    },
    async exportPNG() {
        this.elements.preview.classList.add('print');
        const options = { scale: 2, backgroundColor: '#ffffff', useCORS: true };
        const canvas = await html2canvas(this.elements.preview, options);
        canvas.toBlob(blob => {
            saveAs(blob, `${this.getFileName()}.png`);
            this.elements.preview.classList.remove('print');
        });
    },
    exportTXT() {
        const blob = new Blob([this.getCleanTextForExport()], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${this.getFileName()}.txt`);
    },
    exportMD() {
        const blob = new Blob([this.getCleanTextForExport()], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${this.getFileName()}.md`);
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());
