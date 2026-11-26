import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { JSDOM, VirtualConsole } from 'jsdom';

export const extractFromHtml = createAction({
  audience: 'both',
  name: 'extract_from_html',
  classification: 'READ',
  displayName: 'Extract from HTML',
  description: 'Extract elements or values from an HTML document.',
  aiMetadata: {
    description:
      'Parses an HTML string and extracts elements selected either by a preset target (page title, links, images, headings, paragraphs) or by a custom CSS selector, returning text content, inner HTML, outer HTML, or a named attribute for just the first match or for all matches. Use it to scrape specific values out of fetched HTML; prefer Remove HTML Tags or HTML to Markdown when you want the whole document as text. A custom target requires the selector and attribute extraction requires an attribute name, otherwise it throws; parsing runs with scripts disabled, and it is deterministic and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'html',
      display: 'section',
      label: 'Source',
      icon: 'code',
      props: ['html'],
    },
    {
      key: 'extract',
      display: 'section',
      label: 'What to extract',
      icon: 'filter',
      props: [
        'extract_info',
        'target',
        'selector',
        'extractionType',
        'attributeName',
        'returnMultiple',
      ],
    },
  ],
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      placeholder: '<html><body>…</body></html>',
      required: true,
    }),
    extract_info: Property.MarkDown({
      value:
        '**Custom CSS Selector** is needed when Element is Custom CSS Selector, and **Attribute Name** when Value to Return is Attribute.',
      variant: MarkdownVariant.INFO,
    }),
    target: Property.StaticDropdown({
      displayName: 'Element',
      description: 'Which elements to look for.',
      required: true,
      width: 'half',
      options: {
        disabled: false,
        options: [
          { label: 'Page Title', value: 'title' },
          { label: 'Links', value: 'links' },
          { label: 'Images', value: 'images' },
          { label: 'Headings (H1–H3)', value: 'headings' },
          { label: 'Paragraphs', value: 'paragraphs' },
          { label: 'Custom CSS Selector', value: 'custom' },
        ],
      },
      defaultValue: 'title',
    }),
    selector: Property.ShortText({
      displayName: 'Custom CSS Selector',
      placeholder: '.price',
      required: false,
      width: 'half',
    }),
    extractionType: Property.StaticDropdown({
      displayName: 'Value to Return',
      required: true,
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Text',
            value: 'textContent',
            description: 'Clean text',
            icon: 'type',
          },
          {
            label: 'Inner HTML',
            value: 'innerHtml',
            description: 'Inside the tag',
            icon: 'code',
          },
          {
            label: 'Outer HTML',
            value: 'outerHtml',
            description: 'Tag included',
            icon: 'code',
          },
          {
            label: 'Attribute',
            value: 'attribute',
            description: 'href, src, …',
            icon: 'tag',
          },
        ],
      },
      defaultValue: 'textContent',
    }),
    attributeName: Property.ShortText({
      displayName: 'Attribute Name',
      placeholder: 'href',
      required: false,
    }),
    returnMultiple: Property.Checkbox({
      displayName: 'Return All Matches',
      description: 'When off, only the first match is returned.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      html,
      target,
      selector,
      extractionType,
      attributeName,
      returnMultiple,
    } = context.propsValue;
    let finalSelector = '';
    if (target === 'custom') {
      if (!selector) {
        throw new Error(
          'You must provide a "Custom CSS Selector" when the target is set to Custom.'
        );
      }
      finalSelector = selector;
    } else {
      const predefinedSelectors: Record<string, string> = {
        title: 'title',
        links: 'a[href]',
        images: 'img[src]',
        headings: 'h1, h2, h3',
        paragraphs: 'p',
      };
      finalSelector = predefinedSelectors[target];
    }

    // Create an empty virtual console to swallow spam/errors from malicious HTML
    const virtualConsole = new VirtualConsole();

    const dom = new JSDOM(html, {
      includeNodeLocations: false, // Performance: We don't need line numbers
      runScripts: undefined, // Security: Explicitly disable JS execution (Default, but good to be explicit)
      virtualConsole, // Security: Prevent log spoofing
    });

    try {
      const document = dom.window.document;
      let elements: NodeListOf<Element>;

      try {
        elements = document.querySelectorAll(finalSelector);
      } catch (error) {
        throw new Error(
          `Invalid CSS selector: "${finalSelector}". Error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      if (elements.length === 0) {
        return returnMultiple ? [] : null;
      }

      const extractValue = (el: Element) => {
        switch (extractionType) {
          case 'textContent':
            return el.textContent?.trim() || '';
          case 'innerHtml':
            return el.innerHTML;
          case 'outerHtml':
            return el.outerHTML;
          case 'attribute':
            if (!attributeName) {
              throw new Error(
                'You must provide an "Attribute Name" when the extraction type is Attribute.'
              );
            }
            return el.getAttribute(attributeName) ?? '';
          default:
            return '';
        }
      };

      if (returnMultiple) {
        return Array.from(elements).map((el) => extractValue(el));
      } else {
        return extractValue(elements[0]);
      }
    } finally {
      // Always close the virtual window to prevent memory leaks in the Node environment,
      dom.window.close();
    }
  },
});
