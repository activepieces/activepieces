import { z } from 'zod';

// Define Zod schemas
export const capture_screenshot_schema = z.object({
  page_url: z.string().url('Invalid URL format for page_url'),
  capture_full_page: z.boolean().optional(),
  image_type: z.enum(['png', 'jpeg', 'webp']).optional(),
});

export const generate_pdf_schema = z.object({
  page_url: z.string().url().optional(),
  raw_html: z.string().optional(),
  display_header_footer: z.boolean().optional(),
  print_background_graphics: z.boolean().optional(),
  page_format: z.enum(['A0','A1','A2','A3','A4','A5','Legal','Letter','Tabloid']).optional(),
}).refine(data => data.page_url || data.raw_html, {
  message: 'Either page_url or raw_html must be provided',
});

export const scrape_url_schema = z.object({
  page_url: z.string().url('Invalid URL format for page_url'),
  css_selectors: z.array(z.object({ selector: z.string().min(1) })).min(1, 'At least one CSS selector is required'),
  wait_for_selector: z.string().optional(),
});

export const run_bql_query_schema = z.object({
  add_query: z.string().min(1, 'Query cannot be empty'),
});

export const get_website_performance_schema = z.object({
  page_url: z.string().url('Invalid URL format for page_url'),
});

// Validation functions using direct Zod parsing (not propsValidation.validateZod)
export const validate_props = {
  capture_screenshot: async (propsValue: any) => {
    return capture_screenshot_schema.parseAsync(propsValue);
  },

  generate_pdf: async (propsValue: any) => {
    return generate_pdf_schema.parseAsync(propsValue);
  },

  scrape_url: async (propsValue: any) => {
    return scrape_url_schema.parseAsync(propsValue);
  },

  run_bql_query: async (propsValue: any) => {
    return run_bql_query_schema.parseAsync(propsValue);
  },

  get_website_performance: async (propsValue: any) => {
    return get_website_performance_schema.parseAsync(propsValue);
  }
};
