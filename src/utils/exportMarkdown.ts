import TurndownService from 'turndown';

/**
 * Converts HTML content to Markdown.
 * Handles page breaks via a custom rule for [data-type="pagebreak"].
 */
export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  // Custom rule: page break → horizontal rule
  turndown.addRule('pagebreak', {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const el = node as HTMLElement;
      return el.getAttribute?.('data-type') === 'pagebreak';
    },
    replacement: () => '\n\n---\n\n',
  });

  return turndown.turndown(html);
}
