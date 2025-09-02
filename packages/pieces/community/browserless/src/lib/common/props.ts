import { Property } from '@activepieces/pieces-framework';

export const common_props = {
  page_url: Property.ShortText({
    displayName: 'page_url',
    description: 'the url of the page to process',
    required: true
  })
};

export const screenshot_props = {
  ...common_props,
  capture_full_page: Property.Checkbox({
    displayName: 'capture_full_page',
    description: 'whether to capture the full page or only the viewport',
    required: false,
    defaultValue: false
  }),
  image_type: Property.StaticDropdown({
    displayName: 'image_type',
    description: 'the format of the screenshot',
    required: false,
    defaultValue: 'png',
    options: {
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WebP', value: 'webp' }
      ]
    }
  })
};

export const scrape_props = {
  page_url: Property.ShortText({
    displayName: 'page_url',
    description: 'the url of the page to scrape',
    required: true
  }),
  css_selectors: Property.Json({
    displayName: 'css_selectors',
    description: 'array of css selectors for content to scrape, e.g. [{ "selector": "h1" }]',
    required: true
  }),
  wait_for_selector: Property.ShortText({
    displayName: 'wait_for_selector',
    description: '(optional) css selector to wait for before scraping',
    required: false
  })
};

export const bql_props = {
  add_query: Property.LongText({
    displayName: 'add_query',
    description: 'graphql mutation representing the bql query',
    required: true
  })
};

export const pdf_props = {
  page_url: Property.ShortText({
    displayName: 'page_url',
    description: 'url of the page to generate pdf from',
    required: false
  }),
  raw_html: Property.LongText({
    displayName: 'raw_html',
    description: 'if url is not provided, raw html can be supplied',
    required: false
  }),
  display_header_footer: Property.Checkbox({
    displayName: 'display_header_footer',
    description: 'display header and footer in pdf',
    required: false,
    defaultValue: false
  }),
  print_background_graphics: Property.Checkbox({
    displayName: 'print_background_graphics',
    description: 'include background graphics in pdf',
    required: false,
    defaultValue: true
  }),
  page_format: Property.StaticDropdown({
    displayName: 'page_format',
    description: 'the page format for the pdf',
    defaultValue: 'A4',
    required: false,
    options: {
      options: [
        { label: 'A0', value: 'A0' },
        { label: 'A1', value: 'A1' },
        { label: 'A2', value: 'A2' },
        { label: 'A3', value: 'A3' },
        { label: 'A4', value: 'A4' },
        { label: 'A5', value: 'A5' },
        { label: 'Legal', value: 'Legal' },
        { label: 'Letter', value: 'Letter' },
        { label: 'Tabloid', value: 'Tabloid' }
      ]
    }
  })
};

export const performance_props = {
  page_url: Property.ShortText({
    displayName: 'page_url',
    description: 'url of the website to analyze',
    required: true
  })
};
