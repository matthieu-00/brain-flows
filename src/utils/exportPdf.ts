import html2pdf from 'html2pdf.js';

const PROSE_STYLES = `
  body { margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; }

  .content { font-size: 11pt; line-height: 1.7; color: #2c2c2c; }

  .content p { margin: 0 0 0.75em; }
  .content p:last-child { margin-bottom: 0; }

  .content h1 { font-size: 22pt; font-weight: 700; margin: 0 0 0.5em; }
  .content h2 { font-size: 17pt; font-weight: 700; margin: 0 0 0.5em; }
  .content h3 { font-size: 14pt; font-weight: 700; margin: 0 0 0.5em; }
  .content h4, .content h5, .content h6 { font-size: 12pt; font-weight: 700; margin: 0 0 0.5em; }

  .content ul, .content ol { margin: 0 0 0.75em; padding-left: 1.5em; }
  .content li { margin-bottom: 0.25em; }

  .content blockquote {
    margin: 0 0 0.75em 0;
    padding: 0.5em 0 0.5em 1em;
    border-left: 3px solid #4a7c59;
    color: #6b7280;
  }

  .content pre {
    background: #f3f4f6;
    padding: 0.75em 1em;
    border-radius: 4px;
    font-size: 9pt;
    overflow: hidden;
    margin: 0 0 0.75em;
  }

  .content code {
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    background: #f3f4f6;
    padding: 0.1em 0.3em;
    border-radius: 2px;
  }

  .content pre code { background: none; padding: 0; }

  .content strong { font-weight: 700; }
  .content em { font-style: italic; }

  .content hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }

  /* Page break node */
  [data-type="pagebreak"] {
    display: block;
    height: 0;
    page-break-after: always;
  }
`;

export async function exportToPdf(
  html: string,
  title: string
): Promise<void> {
  const container = document.createElement('div');
  container.className = 'content';
  container.innerHTML = html;

  const wrapper = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = PROSE_STYLES;
  wrapper.appendChild(style);
  wrapper.appendChild(container);

  // Must be in the DOM for html2canvas to render fonts/styles correctly
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  document.body.appendChild(wrapper);

  try {
    await html2pdf()
      .set({
        margin: [20, 20, 20, 20], // top, right, bottom, left in mm
        filename: `${title || 'document'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
