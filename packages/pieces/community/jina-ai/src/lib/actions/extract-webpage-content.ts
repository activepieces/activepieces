import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../auth';
import { extractWebpageContentOutputSchema } from '../output-schemas';

export const extractWebpageContentAction = createAction({
  auth:jinaAiAuth,
  name: 'extract_webpage_content',
  outputSchema: extractWebpageContentOutputSchema,
  classification: 'READ',
  displayName: 'Extract Webpage Content',
  description:
    'Convert a URL into clean, LLM-friendly Markdown using the Reader API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single webpage by URL via the Jina Reader API and return its content cleaned for LLM consumption, with optional markdown/HTML/text/screenshot output, CSS-selector targeting or exclusion, and link/image summaries. Pick this when you already have the target URL; to find pages by keyword first, use Web Search Summarization. Read-only fetch, so repeat calls are idempotent (results may be served from cache unless do-not-track is set).',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'page',
      display: 'section',
      label: 'Page',
      icon: 'file',
      props: ['url', 'format'],
    },
    {
      key: 'links_images',
      display: 'section',
      label: 'Links and Images',
      icon: 'paperclip',
      props: ['links_summary', 'images_summary', 'remove_all_images'],
    },
    {
      key: 'page_elements',
      display: 'section',
      label: 'Page Elements',
      icon: 'filter',
      props: [
        'selectors_info',
        'css_selector',
        'wait_for_selector',
        'exclude_selector',
      ],
    },
  ],
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The webpage to read.',
      placeholder: 'https://example.com/blog/post',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      description:
        'Screenshot and Pageshot return an image URL instead of text.',
      required: true,
      defaultValue: 'default',
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'Text', value: 'text' },
          { label: 'Screenshot', value: 'screenshot' },
          { label: 'Pageshot', value: 'pageshot' },
        ],
      },
    }),
    links_summary: Property.StaticDropdown({
      displayName: 'Gather Links',
      required: false,
      width: 'half',
      defaultValue: 'none',
      options: {
        options: [
          { label: 'Keep inline', value: 'none' },
          { label: 'Unique, at the end', value: 'true' },
          { label: 'All, at the end', value: 'all' },
        ],
      },
    }),
    images_summary: Property.StaticDropdown({
      displayName: 'Gather Images',
      required: false,
      width: 'half',
      defaultValue: 'none',
      options: {
        options: [
          { label: 'Keep inline', value: 'none' },
          { label: 'Unique, at the end', value: 'true' },
          { label: 'All, at the end', value: 'all' },
        ],
      },
    }),
    remove_all_images: Property.Checkbox({
      displayName: 'Remove All Images',
      description: 'Strip every image from the result.',
      required: false,
      defaultValue: false,
    }),
    selectors_info: Property.MarkDown({
      value:
        'Use CSS selectors, separated by commas. Leave all three empty to read the whole page.',
      variant: MarkdownVariant.INFO,
    }),
    css_selector: Property.LongText({
      displayName: 'Only Include',
      description: 'Keep only these elements.',
      placeholder: 'article, .main-content',
      required: false,
    }),
    wait_for_selector: Property.LongText({
      displayName: 'Wait For',
      description: 'Wait until these elements load before reading.',
      placeholder: '#dynamic-content',
      required: false,
    }),
    exclude_selector: Property.LongText({
      displayName: 'Remove',
      description: 'Drop these elements from the result.',
      placeholder: 'header, footer, .ads',
      required: false,
    }),
    json_response: Property.Checkbox({
      displayName: 'JSON Response',
      description: 'Return the result as JSON instead of plain text.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    timeout_seconds: Property.Number({
      displayName: 'Timeout',
      description: "Seconds to wait for the page to load. 0: Jina's default.",
      required: false,
      advanced: true,
      defaultValue: 0,
    }),
    follow_redirect: Property.Checkbox({
      displayName: 'Follow Redirects',
      description: 'Use the final URL after following all redirects.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    iframe_extraction: Property.Checkbox({
      displayName: 'Include Iframe Content',
      description: 'Also read content inside embedded iframes.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    shadow_dom_extraction: Property.Checkbox({
      displayName: 'Include Shadow DOM Content',
      description: 'Also read content inside Shadow DOM elements.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    do_not_track: Property.Checkbox({
      displayName: 'Do Not Cache or Track',
      description: "Jina won't cache or log the requested URL.",
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    eu_compliance: Property.Checkbox({
      displayName: 'EU Compliance',
      description: 'Process the request only on EU infrastructure.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      url,
      format,
      remove_all_images,
      links_summary,
      images_summary,
      do_not_track,
      iframe_extraction,
      shadow_dom_extraction,
      follow_redirect,
      eu_compliance,
      json_response,
      timeout_seconds,
      css_selector,
      wait_for_selector,
      exclude_selector,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const baseReaderUrl = eu_compliance
      ? JinaAICommon.euReaderUrl
      : JinaAICommon.readerUrl;
    const finalUrl = `${baseReaderUrl}/${encodeURIComponent(url)}`;
    const headers: Record<string, string> = {};
    if (format && format !== 'default') {
      headers['X-Return-Format'] = format;
    }

    if (json_response) {
      headers['Accept'] = 'application/json';
    }

    if (timeout_seconds && timeout_seconds > 0) {
      headers['X-Timeout'] = timeout_seconds.toString();
    }

    if (css_selector) {
      headers['X-Target-Selector'] = css_selector;
    }

    if (wait_for_selector) {
      headers['X-Wait-For-Selector'] = wait_for_selector;
    }

    if (exclude_selector) {
      headers['X-Remove-Selector'] = exclude_selector;
    }

    if (remove_all_images) {
      headers['X-Retain-Images'] = 'none';
    }

    if (links_summary && links_summary !== 'none') {
      headers['X-With-Links-Summary'] = links_summary;
    }

    if (images_summary && images_summary !== 'none') {
      headers['X-With-Images-Summary'] = images_summary;
    }

    if (do_not_track) {
      headers['DNT'] = '1';
    }

    if (iframe_extraction) {
      headers['X-With-Iframe'] = 'true';
    }

    if (shadow_dom_extraction) {
      headers['X-With-Shadow-Dom'] = 'true';
    }

    if (follow_redirect) {
      headers['X-Base'] = 'final';
    }

    const response = await JinaAICommon.makeRequest({
      url: finalUrl,
      method: HttpMethod.GET,
      auth: apiKey.secret_text,
      body: undefined,
      headers,
    });

    return response;
  },
});
