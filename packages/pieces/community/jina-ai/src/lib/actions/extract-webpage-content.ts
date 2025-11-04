import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../../index';

export const extractWebpageContentAction = createAction({
  auth:jinaAiAuth,
  name: 'extract_webpage_content',
  displayName: 'Extract Webpage Content',
  description:
    'Convert a URL into clean, LLM-friendly Markdown using the Reader API.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the webpage to extract content from.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      description:
        'Format of the extracted content - how the webpage should be returned.',
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
    remove_all_images: Property.Checkbox({
      displayName: 'Remove All Images',
      description: 'Remove all images from the response.',
      required: false,
      defaultValue: false,
    }),
    links_summary: Property.StaticDropdown({
      displayName: 'Gather Links',
      description:
        'Create a "Buttons & Links" section at the end to help downstream LLMs or web agents navigate the page.',
      required: false,
      defaultValue: 'none',
      options: {
        options: [
          { label: 'None - Keep links inline', value: 'none' },
          { label: 'Dedup - List unique links at the end', value: 'true' },
          { label: 'All - List all links at the end', value: 'all' },
        ],
      },
    }),
    images_summary: Property.StaticDropdown({
      displayName: 'Gather Images',
      description:
        'Create an "Images" section at the end, giving downstream LLMs an overview of all visuals on the page.',
      required: false,
      defaultValue: 'none',
      options: {
        options: [
          { label: 'None - Keep images inline', value: 'none' },
          { label: 'Dedup - List unique images at the end', value: 'true' },
          { label: 'All - List all images at the end', value: 'all' },
        ],
      },
    }),
    do_not_track: Property.Checkbox({
      displayName: 'Do Not Cache & Track!',
      description:
        "When enabled, the requested URL won't be cached and tracked on our server.",
      required: false,
      defaultValue: false,
    }),
    iframe_extraction: Property.Checkbox({
      displayName: 'iframe Extraction',
      description:
        'Processes content from all embedded iframes in the DOM tree.',
      required: false,
      defaultValue: false,
    }),
    shadow_dom_extraction: Property.Checkbox({
      displayName: 'Shadow DOM Extraction',
      description: 'Extracts content from all Shadow DOM roots in the document.',
      required: false,
      defaultValue: false,
    }),
    follow_redirect: Property.Checkbox({
      displayName: 'Follow Redirect',
      description:
        'Choose whether to resolve to the final destination URL after following all redirects. Enable to follow the full redirect chain.',
      required: false,
      defaultValue: false,
    }),
    eu_compliance: Property.Checkbox({
      displayName: 'EU Compliance',
      description:
        'All infrastructure and data processing operations reside entirely within EU jurisdiction.',
      required: false,
      defaultValue: false,
    }),
    json_response: Property.Checkbox({
      displayName: 'JSON Response',
      description:
        'Return response in JSON format containing URL, title, content, and timestamp (if available).',
      required: false,
      defaultValue: false,
    }),
    timeout_seconds: Property.Number({
      displayName: 'Timeout Seconds',
      description:
        'Maximum page load wait time in seconds (0 means use default timeout, set a value if the default browser engine is too slow on simple webpages).',
      required: false,
      defaultValue: 0,
    }),
    css_selector: Property.LongText({
      displayName: 'CSS Selector: Only',
      description:
        'List of CSS selectors to target specific page elements (e.g., "body, .main-content, #article").',
      required: false,
    }),
    wait_for_selector: Property.LongText({
      displayName: 'CSS Selector: Wait-For',
      description:
        'CSS selectors to wait for before returning results (e.g., "#dynamic-content, .lazy-loaded").',
      required: false,
    }),
    exclude_selector: Property.LongText({
      displayName: 'CSS Selector: Excluding',
      description:
        'CSS selectors for elements to remove from the results (e.g., "header, footer, .ads, #sidebar").',
      required: false,
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
      auth: apiKey as string,
      body: undefined,
      headers,
    });

    return response;
  },
});
