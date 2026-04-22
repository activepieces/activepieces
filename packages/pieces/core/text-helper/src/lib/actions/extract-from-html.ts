import { createAction, Property } from '@activepieces/pieces-framework';
import { JSDOM, VirtualConsole } from 'jsdom';

export const extractFromHtml = createAction({
  name: 'extract_from_html',
  displayName: 'Extract from HTML',
  description: 'Extract specific elements or data from an HTML document.',
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      description: 'The raw HTML string to extract data from.',
      required: true,
    }),
    target: Property.StaticDropdown({
      displayName: 'Extraction Target',
      description: 'What do you want to extract from the page?',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Page Title', value: 'title' },
          { label: 'All Links (<a> elements)', value: 'links' },
          { label: 'All Images', value: 'images' },
          { label: 'Main Headings (H1, H2, H3)', value: 'headings' },
          { label: 'Paragraphs / Text Blocks', value: 'paragraphs' },
          { label: 'Custom CSS Selector (Advanced)', value: 'custom' },
        ],
      },
      defaultValue: 'title',
    }),
    selector: Property.ShortText({
      displayName: 'Custom CSS Selector',
      description:
        'ONLY required if "Extraction Target" is set to "Custom CSS Selector". (e.g., .price, #main-title)',
      required: false,
    }),
    extractionType: Property.StaticDropdown({
      displayName: 'Extraction Type',
      description: 'What part of the element do you want to extract?',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Text Content (Clean Text)', value: 'textContent' },
          { label: 'Inner HTML', value: 'innerHtml' },
          { label: 'Outer HTML', value: 'outerHtml' },
          { label: 'Attribute (e.g., href, src)', value: 'attribute' },
        ],
      },
      defaultValue: 'textContent',
    }),
    attributeName: Property.ShortText({
      displayName: 'Attribute Name',
      description:
        'ONLY required if "Extraction Type" is set to "Attribute". (e.g., href, src, data-id)',
      required: false,
    }),
    returnMultiple: Property.Checkbox({
      displayName: 'Return Multiple Elements',
      description:
        'If checked, returns a list of all matching elements. If unchecked, returns only the first match.',
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
      finalSelector = predefinedSelectors[target as string];
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
            (error as Error).message
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
