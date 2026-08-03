/**
 * turndown-table-normalizer-plugin.ts
 *
 * A Turndown plugin that normalizes complex HTML tables — cells with
 * multi-paragraph content or nested lists, and cells using rowspan/
 * colspan — so they convert to clean GFM Markdown tables instead of
 * falling back to raw HTML pass-through.
 *
 * This is a general-purpose fix, not specific to any one source system.
 * Any HTML table with these characteristics will trip up GFM table
 * plugins (e.g. @joplin/turndown-plugin-gfm), regardless of where the
 * HTML came from — Confluence, Word/Google Docs exports, Notion
 * exports, CMS output, or scraped web pages. Wherever a <td>/<th>
 * contains a <p>, <div>, <ul>, <ol>, heading (<h1>-<h6>), <hr>, or
 * <blockquote>, or uses rowspan/colspan, this plugin applies. A
 * genuinely nested <table> inside a cell is left untouched, since
 * there is no lossless GFM representation for that — the outer table
 * correctly falls back to raw HTML in that one case.
 *
 * NOTE ON CONVENTION: unlike ordinary Turndown plugins — which
 * only ever call addRule()/keep()/remove() to register per-node
 * conversion rules — this plugin overrides turndownService.turndown()
 * itself. This is necessary because the problem it solves must be
 * fixed *before* any node-level rule runs (including a GFM plugin's
 * own table rule, which is what decides whether to render a table as
 * Markdown or bail to raw HTML). Rule-based interception was tried
 * and rejected: it would either lose the race against the GFM
 * plugin's table rule (if registered first) or require re-implementing
 * GFM's table rendering from scratch (if registered last).
 *
 * The upside of this approach: because it wraps the whole conversion
 * call rather than competing for rule-matching priority, it is
 * order-independent — it behaves identically whether you call
 * service.use(gfm) before or after service.use(tableNormalizer).
 *
 * NOTE ON DOM IMPLEMENTATION: this plugin uses jsdom to parse HTML
 * strings. Turndown itself uses a different parser internally
 * (@mixmark-io/domino) to convert string input into a DOM before any
 * rule runs — see the "leaky abstraction" note below — but Turndown
 * doesn't expose that internal parser for a plugin to reuse, so a
 * plugin needing pre-traversal DOM access has to bring its own. jsdom
 * is used here because it's already a dependency in this project's
 * environment; @mixmark-io/domino (the same lightweight parser
 * Turndown uses internally) is an equally valid, lighter-weight
 * choice if jsdom isn't already present elsewhere in your dependency
 * tree.
 *
 * WHY THIS NEEDS A PARSER AT ALL (leaky abstraction note): Turndown's
 * plugin API (addRule/keep/remove/use) only lets a plugin register
 * per-node conversion rules that run during Turndown's node-by-node
 * tree walk — strictly after HTML has already been parsed into a DOM.
 * There is no exposed hook for "run before parsing" or "run before
 * traversal begins," and no way to reach the parser/document Turndown
 * uses internally (it's a private, module-level singleton, not
 * attached to the TurndownService instance or its `options`). Since
 * this plugin's whole purpose is to normalize table structure BEFORE
 * any rule (including a GFM plugin's own table rule) ever sees it,
 * it has no choice but to do its own parsing when given a string.
 *
 * Usage:
 *   import TurndownService from 'turndown'  // or @joplin/turndown
 *   import { gfm } from 'turndown-plugin-gfm'  // or any GFM fork
 *   import tableNormalizer from './turndown-table-normalizer-plugin'
 *
 *   const service = new TurndownService()
 *   service.use(gfm)
 *   service.use(tableNormalizer)  // order relative to gfm doesn't matter
 *
 *   const markdown = service.turndown(html)
 */

import { JSDOM } from 'jsdom';

// TurndownService's own package (and @joplin/turndown, which doesn't
// ship its own type declarations) both have the same runtime shape.
// Typing against the community `turndown` types works for either,
// since we only rely on the standard TurndownService instance API
// (turndown(), addRule(), etc.), not anything package-specific.
import type TurndownService from 'turndown';

/**
 * Recursively flattens a single table cell's block-level content
 * (paragraphs, nested lists, headings, <hr>, <blockquote>) into a
 * single line using '<br>' as a separator, since GFM table cells
 * cannot contain block elements.
 *
 * Handles nesting at any depth, including lists nested inside list
 * items, and block content nested inside inline wrapper elements
 * (e.g. a <ul> inside a <span>). A genuinely nested <table> is left
 * as-is (see module docstring).
 *
 * @param cell - the <td> or <th> to flatten in place
 */
function flattenCellContent(cell: HTMLTableCellElement): void {
  function walk(node: Node, depth: number): string[] {
    const parts: string[] = [];

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3 /* Node.TEXT_NODE */) {
        if (child.textContent && child.textContent.trim()) {
          parts.push(child.textContent);
        }
        continue;
      }
      if (child.nodeType !== 1 /* Node.ELEMENT_NODE */) continue;

      const element = child as Element;
      const tag = element.nodeName.toLowerCase();

      if (tag === 'p' || tag === 'div') {
        parts.push(...walk(element, depth));
        parts.push('<br>');
      } else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(element.children).filter(
          (c) => c.nodeName.toLowerCase() === 'li'
        );
        items.forEach((li, i) => {
          const indent = '&nbsp;'.repeat(depth * 2);
          const prefix = tag === 'ol' ? `${i + 1}. ` : '- ';
          const liParts = walk(li, depth + 1);
          const liContent = liParts.join('').replace(/(<br>\s*)+$/g, '');
          parts.push(indent + prefix + liContent);
          parts.push('<br>');
        });
      } else if (/^h[1-6]$/.test(tag)) {
        // Headings are block-level and trip the fallback gate; render
        // as bold text on its own line instead.
        const headingContent = walk(element, depth).join('');
        parts.push(`<strong>${headingContent}</strong>`);
        parts.push('<br>');
      } else if (tag === 'hr') {
        // <hr> trips the fallback gate; represent as a plain separator
        // rather than a literal <hr> tag.
        parts.push('---');
        parts.push('<br>');
      } else if (tag === 'blockquote') {
        // <blockquote> trips the fallback gate; represent inline with
        // a leading marker instead of a literal block element.
        const quoteContent = walk(element, depth)
          .join('')
          .replace(/(<br>\s*)+$/g, '');
        parts.push('&gt; ' + quoteContent);
        parts.push('<br>');
      } else if (tag === 'table') {
        // A genuinely nested table has no lossless GFM representation.
        // Leave it untouched -- the outer table will correctly (and
        // appropriately) fall back to raw HTML for this case, which
        // is the right outcome rather than something to flatten away.
        parts.push((element as HTMLElement).outerHTML);
      } else {
        // Inline element (strong, em, code, a, span, etc.) — recurse
        // to catch any block content nested inside an inline wrapper,
        // but preserve the wrapping tag itself.
        const clone = element.cloneNode(false) as HTMLElement;
        clone.innerHTML = walk(element, depth).join('');
        parts.push(clone.outerHTML);
      }
    }

    return parts;
  }

  let html = walk(cell, 0).join('');
  html = html
    .replace(/(<br>\s*)+$/g, '') // trim trailing line breaks
    .replace(/(<br>\s*){2,}/g, '<br>'); // collapse consecutive breaks
  cell.innerHTML = html.trim();
}

interface GridCell {
  html: string;
  isHeader: boolean;
}

/**
 * Expands rowspan/colspan into a full rectangular grid by duplicating
 * cell content into every position the original cell spanned, since
 * GFM Markdown tables have no concept of merged cells.
 *
 * @param table
 * @param document - owner document, used to create new cell elements
 */
function expandSpans(table: HTMLTableElement, document: Document): void {
  const rows = Array.from(table.querySelectorAll('tr'));
  const grid: (GridCell | undefined)[][] = [];

  rows.forEach((row, rowIndex) => {
    if (!grid[rowIndex]) grid[rowIndex] = [];
    let colIndex = 0;
    const cells = Array.from(row.children).filter(
      (c): c is HTMLTableCellElement =>
        c.nodeName === 'TD' || c.nodeName === 'TH'
    );

    cells.forEach((cell) => {
      while (grid[rowIndex][colIndex] !== undefined) colIndex++;

      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);

      for (let r = 0; r < rowspan; r++) {
        if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
        for (let c = 0; c < colspan; c++) {
          grid[rowIndex + r][colIndex + c] = {
            html: cell.innerHTML,
            isHeader: cell.nodeName === 'TH',
          };
        }
      }
      colIndex += colspan;
    });
  });

  grid.forEach((gridRow, rowIndex) => {
    const rowEl = rows[rowIndex];
    if (!rowEl) return;
    Array.from(rowEl.children).forEach((c) => c.remove());
    gridRow.forEach((cellData) => {
      if (!cellData) return;
      const cellEl = document.createElement(cellData.isHeader ? 'th' : 'td');
      cellEl.innerHTML = cellData.html;
      rowEl.appendChild(cellEl);
    });
  });
}

/**
 * Runs expandSpans + flattenCellContent on every <table> in a document.
 * @param document
 */
function normalizeTables(document: Document): void {
  Array.from(document.querySelectorAll('table')).forEach((table) => {
    expandSpans(table, document);
    Array.from(table.querySelectorAll('td, th')).forEach((cell) =>
      flattenCellContent(cell as HTMLTableCellElement)
    );
  });
}

/**
 * The Turndown plugin entry point. Wraps turndownService.turndown()
 * so that table normalization always runs first, regardless of
 * .use() registration order relative to other plugins.
 *
 * @param turndownService
 */
function turndownTableNormalizerPlugin(
  turndownService: TurndownService
): TurndownService {
  const originalTurndown = turndownService.turndown.bind(turndownService);

  turndownService.turndown = function (
    input: string | TurndownService.Node
  ): string {
    let root: TurndownService.Node;

    if (typeof input === 'string') {
      const dom = new JSDOM(input);
      normalizeTables(dom.window.document);
      root = dom.window.document.body as unknown as TurndownService.Node;
    } else {
      // input is already a DOM Node/Element/Document/DocumentFragment
      const node = input as unknown as Node;
      const doc = (node.ownerDocument || node) as unknown as Document;
      normalizeTables(doc);
      root = input;
    }

    return originalTurndown(root);
  };

  return turndownService;
}

/**
 * Public shape of the exported plugin: callable (for service.use()),
 * with the underlying helpers attached for standalone use/testing.
 */
interface TurndownTableNormalizerPlugin {
  (turndownService: TurndownService): TurndownService;
  normalizeTables: typeof normalizeTables;
  expandSpans: typeof expandSpans;
  flattenCellContent: typeof flattenCellContent;
}

const plugin = turndownTableNormalizerPlugin as TurndownTableNormalizerPlugin;
plugin.normalizeTables = normalizeTables;
plugin.expandSpans = expandSpans;
plugin.flattenCellContent = flattenCellContent;

// Using `export =` (TypeScript's CommonJS-native export) rather than
// `export default` so that plain `require('./turndown-table-normalizer-plugin')`
// returns the callable plugin function directly -- matching the
// original JS module's module.exports = plugin pattern -- rather than
// `export default`'s `{ default: plugin }` shape, which would break
// existing `require()`-based usage.
export = plugin;
