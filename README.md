# Conversor Universal

Una herramienta web estática, minimalista y potente para convertir Markdown y HTML a múltiples formatos. Funciona completamente en el navegador, sin necesidad de un backend.

## ¿Qué hace?

- **Editor en vivo:** Escribe o pega Markdown/HTML en el panel izquierdo.
- **Previsualización fiel:** Observa en el panel derecho una vista previa limpia (en una "hoja" blanca) que refleja cómo se verá tu exportación.
- **Carga de archivos:** Carga archivos locales `.md`, `.txt` o `.html` para editarlos y convertirlos.
- **Exportación múltiple:** Descarga tu contenido en formatos de calidad profesional:
  - **PDF:** Documento multipágina, nítido y con márgenes adecuados.
  - **DOCX:** Archivo de Word con texto limpio.
  - **PNG:** Imagen de alta resolución de la vista previa.
  - **TXT:** Texto plano.
  - **MD:** El contenido original en formato Markdown.

## Cómo Usarlo

1.  **Abre `index.html`** en tu navegador o despliégalo en un servidor estático.
2.  **Escribe o carga** tu contenido en el editor.
3.  **Usa los botones** en la barra de acciones superior para exportar al formato que necesites.

### Nota sobre Colores

Markdown puro no tiene una sintaxis para definir colores de texto. Si necesitas colores específicos en tu documento (especialmente para la exportación a PDF o PNG), debes usar etiquetas HTML directamente en el editor.

**Ejemplo:**
```html
Esto es texto normal, pero <span style="color:#e50914">esto es rojo</span>.
