import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  HeadingLevel,
} from 'docx';

const HEADING_LEVELS: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  H1: HeadingLevel.HEADING_1,
  H2: HeadingLevel.HEADING_2,
  H3: HeadingLevel.HEADING_3,
  H4: HeadingLevel.HEADING_4,
  H5: HeadingLevel.HEADING_5,
  H6: HeadingLevel.HEADING_6,
};

interface RunFormat {
  bold?: boolean;
  italics?: boolean;
  font?: string;
}

function parseInlineRuns(node: Node, format: RunFormat = {}): TextRun[] {
  const runs: TextRun[] = [];

  function walk(n: Node, f: RunFormat) {
    if (n.nodeType === Node.TEXT_NODE && n.textContent) {
      const text = n.textContent;
      if (text.trim()) {
        runs.push(new TextRun({ text, ...f }));
      }
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;

    const el = n as HTMLElement;
    const tag = el.tagName?.toUpperCase();

    if (tag === 'STRONG' || tag === 'B') {
      for (const child of Array.from(el.childNodes)) walk(child, { ...f, bold: true });
      return;
    }
    if (tag === 'EM' || tag === 'I') {
      for (const child of Array.from(el.childNodes)) walk(child, { ...f, italics: true });
      return;
    }
    if (tag === 'CODE') {
      const text = el.textContent || '';
      if (text) {
        runs.push(new TextRun({ text, font: 'Courier New', ...f }));
      }
      return;
    }
    if (tag === 'A') {
      const text = el.textContent || '';
      if (text) {
        runs.push(
          new TextRun({
            text,
            ...f,
            style: 'Hyperlink',
            underline: { type: 'single' },
          })
        );
      } else {
        for (const child of Array.from(el.childNodes)) walk(child, f);
      }
      return;
    }

    for (const child of Array.from(el.childNodes)) walk(child, f);
  }

  walk(node, format);
  return runs;
}

function htmlToDocxChildren(html: string): Paragraph[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  const result: Paragraph[] = [];

  const processBlock = (el: HTMLElement): Paragraph | Paragraph[] | null => {
    const tag = el.tagName?.toUpperCase();

    if (el.getAttribute?.('data-type') === 'pagebreak') {
      return new Paragraph({ children: [new PageBreak()] });
    }

    if (tag === 'HR') {
      return new Paragraph({
        border: { bottom: { color: 'CCCCCC', space: 1, style: 'single', size: 6 } },
      });
    }

    if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') {
      const level = HEADING_LEVELS[tag];
      const runs = parseInlineRuns(el);
      if (runs.length === 0) runs.push(new TextRun({ text: ' ' }));
      return new Paragraph({ heading: level, children: runs });
    }

    if (tag === 'PRE') {
      const text = el.textContent || '';
      return new Paragraph({
        children: [new TextRun({ text: text || ' ', font: 'Courier New' })],
      });
    }

    if (tag === 'BLOCKQUOTE') {
      const runs = parseInlineRuns(el);
      if (runs.length === 0) runs.push(new TextRun({ text: ' ' }));
      return new Paragraph({
        children: runs,
        indent: { left: 720 },
        border: { left: { color: '4a7c59', space: 1, style: 'single', size: 12 } },
      });
    }

    if (tag === 'UL' || tag === 'OL') {
      const paragraphs: Paragraph[] = [];
      for (const li of el.querySelectorAll(':scope > li')) {
        const runs = parseInlineRuns(li);
        if (runs.length === 0) runs.push(new TextRun({ text: ' ' }));
        paragraphs.push(new Paragraph({ children: runs, bullet: { level: 0 } }));
      }
      return paragraphs.length > 0 ? paragraphs : null;
    }

    if (tag === 'P') {
      const runs = parseInlineRuns(el);
      if (runs.length === 0) runs.push(new TextRun({ text: ' ' }));
      return new Paragraph({ children: runs });
    }

    return null;
  };

  function walk(parent: Element) {
    for (const el of parent.children) {
      const child = el as HTMLElement;
      const tag = child.tagName?.toUpperCase();
      const isPageBreak = child.getAttribute?.('data-type') === 'pagebreak';
      const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'HR', 'UL', 'OL'];
      const isBlock = blockTags.includes(tag) || (tag === 'DIV' && isPageBreak);
      if (isBlock) {
        const block = processBlock(child);
        if (block) {
          if (Array.isArray(block)) {
            result.push(...block);
          } else {
            result.push(block);
          }
        }
      } else {
        walk(child);
      }
    }
  }

  walk(body);
  return result;
}

/**
 * Converts HTML content to DOCX and returns a Blob for download.
 * Uses the docx package (browser-compatible) instead of html-to-docx.
 */
export async function htmlToDocxBlob(html: string, title: string): Promise<Blob> {
  const children = htmlToDocxChildren(html);

  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  const doc = new Document({
    title,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: children as Paragraph[],
      },
    ],
  });

  return Packer.toBlob(doc);
}
