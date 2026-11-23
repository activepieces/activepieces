import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { conversionOutputSchema, pdfcrowdConvert, readAttachments } from '../common/convert';
import { pdfcrowdPdfOptions } from '../common/pdf-options';

export const urlToPdfAction = createAction({
  name: 'url_to_pdf',
  classification: 'READ',
  displayName: 'Convert URL to PDF',
  description: 'Convert a public web page to a PDF file.',
  audience: 'human',
  aiMetadata: { description: 'Render a publicly accessible web page URL into a PDF file via the Pdfcrowd API, returning the generated document. Choose this when the source is a live URL rather than raw HTML markup (use Convert HTML to PDF for an HTML string). Supports extensive layout, header/footer, watermark, and security options. Not idempotent: each call performs a fresh conversion that produces a new file and consumes account credits.', idempotent: false },
  auth: pdfcrowdAuth,
  outputSchema: conversionOutputSchema,
  propertyGroups: [
    { key: 'source', display: 'section', label: 'Source', icon: 'file', props: ['url'] },
    {
      key: 'page',
      display: 'section',
      label: 'Page',
      icon: 'sliders',
      props: ['page_size', 'orientation', 'margin_top', 'margin_right', 'margin_bottom', 'margin_left', 'no_margins', 'print_page_range'],
    },
    {
      key: 'header_footer',
      display: 'section',
      label: 'Header and Footer',
      icon: 'text',
      props: ['header_footer_info', 'header_html', 'header_url', 'footer_html', 'footer_url', 'header_height', 'footer_height'],
    },
    {
      key: 'security',
      display: 'section',
      label: 'Password Protection',
      icon: 'user',
      props: ['user_password', 'owner_password', 'no_print', 'no_modify', 'no_copy', 'encrypt'],
    },
  ],
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Address of a public web page.',
      placeholder: 'https://example.com/invoice',
      required: true,
    }),
    ...pdfcrowdPdfOptions({ templateAdvanced: true }),
  },
  async run(context) {
    const { auth, propsValue, files } = context;
    const values: Record<string, unknown> = { ...propsValue };
    const fields: Record<string, unknown> = { url: propsValue.url };
    for (const opt of BASIC_OPTIONS) {
      fields[opt] = values[opt];
    }
    if (propsValue.data_string) {
      fields['data_string'] = propsValue.data_string;
      for (const opt of DATA_OPTIONS) {
        fields[opt] = values[opt];
      }
    }
    return pdfcrowdConvert({
      auth,
      files,
      fields,
      attachments: readAttachments({ values, fieldNames: FILE_OPTIONS }),
      filename: propsValue.outputFilename || 'document.pdf',
      converterVersion: propsValue.converter_version || undefined,
    });
  },
});

const BASIC_OPTIONS = [
  'page_size',
  'page_width',
  'page_height',
  'orientation',
  'margin_top',
  'margin_right',
  'margin_bottom',
  'margin_left',
  'no_margins',
  'print_page_range',
  'content_viewport_width',
  'content_viewport_height',
  'content_fit_mode',
  'remove_blank_pages',
  'header_url',
  'header_html',
  'header_height',
  'footer_url',
  'footer_html',
  'footer_height',
  'no_header_footer_horizontal_margins',
  'exclude_header_on_pages',
  'exclude_footer_on_pages',
  'header_footer_scale_factor',
  'page_numbering_offset',
  'page_watermark_url',
  'multipage_watermark_url',
  'page_background_url',
  'multipage_background_url',
  'page_background_color',
  'use_print_media',
  'no_background',
  'disable_javascript',
  'disable_image_loading',
  'disable_remote_fonts',
  'load_iframes',
  'block_ads',
  'default_encoding',
  'locale',
  'http_auth_user_name',
  'http_auth_password',
  'cookies',
  'verify_ssl_certificates',
  'fail_on_main_url_error',
  'fail_on_any_url_error',
  'css_page_rule_mode',
  'custom_css',
  'custom_javascript',
  'on_load_javascript',
  'custom_http_header',
  'javascript_delay',
  'element_to_convert',
  'element_to_convert_mode',
  'wait_for_element',
  'auto_detect_element_to_convert',
  'readability_enhancements',
  'scale_factor',
  'jpeg_quality',
  'convert_images_to_jpeg',
  'image_dpi',
  'enable_pdf_forms',
  'linearize',
  'encrypt',
  'user_password',
  'owner_password',
  'no_print',
  'no_modify',
  'no_copy',
  'title',
  'subject',
  'author',
  'keywords',
  'extract_meta_tags',
  'page_layout',
  'page_mode',
  'initial_zoom_type',
  'initial_page',
  'initial_zoom',
  'hide_toolbar',
  'hide_menubar',
  'hide_window_ui',
  'fit_window',
  'center_window',
  'display_title',
  'right_to_left',
  'debug_log',
  'tag',
  'http_proxy',
  'https_proxy',
  'layout_dpi',
  'main_document_css_annotation',
  'header_footer_css_annotation',
  'conversion_config',
];

const DATA_OPTIONS = [
  'data_format',
  'data_ignore_undefined',
  'data_auto_escape',
  'data_trim_blocks',
  'data_options',
];

const FILE_OPTIONS = [
  'page_watermark',
  'multipage_watermark',
  'page_background',
  'multipage_background',
];
