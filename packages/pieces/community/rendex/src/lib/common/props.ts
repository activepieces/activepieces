import { Property } from '@activepieces/pieces-framework';
import { rendexAuth } from './auth';
import { rendexClient } from './client';
import { RENDEX_LIMITS, rendexInput, Source } from './common';

function yesNo({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string>({
    displayName,
    description,
    required: false,
    options: { options: YES_NO_OPTIONS },
  });
}

function choice({ displayName, description, values }: { displayName: string; description: string; values: readonly { label: string; value: string }[] }) {
  return Property.StaticDropdown<string>({
    displayName,
    description,
    required: false,
    options: { options: [...values] },
  });
}

function sourceProps() {
  return {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'A public web page to capture, like https://example.com. Give exactly one of URL, HTML or Markdown.',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'HTML markup to render (up to 5 MB). Give exactly one of URL, HTML or Markdown.',
      required: false,
    }),
    markdown: Property.LongText({
      displayName: 'Markdown',
      description: 'Markdown to render (up to 5 MB). Give exactly one of URL, HTML or Markdown.',
      required: false,
    }),
    template_data: Property.Json({
      displayName: 'Template Data',
      description: 'Values for Rendex {{placeholders}} in the HTML or Markdown, like {"name": "Ada"} (up to 256 KB). Not allowed with URL. Activepieces replaces {{...}} that you type in a field with its own data before Rendex sees it, so placeholders typed here never reach Rendex. Template Data only works when the HTML or Markdown with {{placeholders}} is mapped in from an earlier step (mapped values are passed as-is); otherwise insert the values directly with the data selector.',
      required: false,
    }),
  };
}

function captureProps() {
  return {
    format: choice({ displayName: 'Format', description: 'Output format. Default PNG.', values: FORMAT_OPTIONS }),
    width: Property.Number({ displayName: 'Width', description: 'Viewport width in pixels, 320 to 3840. Default 1280.', required: false }),
    height: Property.Number({ displayName: 'Height', description: 'Viewport height in pixels, 240 to 2160. Default 800.', required: false }),
    full_page: yesNo({ displayName: 'Full Page', description: 'Yes captures the whole scrollable page (cut at 16,384 px) instead of the viewport. Default no.' }),
    selector: Property.ShortText({ displayName: 'Element Selector', description: 'CSS selector of one element to capture instead of the page, like #pricing.', required: false }),
  };
}

function pageProps() {
  return {
    device: choice({ displayName: 'Device', description: 'Device preset (viewport, scale and user agent). Default desktop.', values: DEVICE_OPTIONS }),
    wait_until: choice({ displayName: 'Wait Until', description: 'When the page counts as loaded. Default Load event for HTML and Markdown (network idle times out on inline content) and Network idle (2 connections) for a URL.', values: WAIT_UNTIL_OPTIONS }),
    timeout_seconds: Property.Number({ displayName: 'Timeout (seconds)', description: 'How long Rendex waits for the page to load, 5 to 60. Default 30.', required: false }),
    block_cookie_banners: yesNo({ displayName: 'Hide Cookie Banners', description: 'Yes hides common cookie and consent banners. Default no.' }),
    hide_selectors: Property.Array({ displayName: 'Hide Elements', description: 'CSS selectors of elements to hide first, like .chat-widget (up to 50).', required: false }),
  };
}

function screenshotExtraProps() {
  return {
    wait_for_selector: Property.ShortText({ displayName: 'Wait For Element', description: 'CSS selector to wait for before capturing, like #chart.', required: false }),
    delay_ms: Property.Number({ displayName: 'Delay (ms)', description: 'Extra wait after load, 0 to 10000 ms. Default 0.', required: false }),
    dark_mode: yesNo({ displayName: 'Dark Mode', description: 'Yes renders with prefers-color-scheme: dark. Default no.' }),
    block_ads: yesNo({ displayName: 'Block Ads', description: 'Block ads and trackers. Default yes.' }),
    quality: Property.Number({ displayName: 'Quality', description: 'JPEG or WebP quality, 1 to 100. Default 80.', required: false }),
    pdf_format: choice({ displayName: 'PDF Paper Size', description: 'Paper size when Format is PDF. Default A4.', values: PAPER_OPTIONS }),
    pdf_landscape: yesNo({ displayName: 'PDF Landscape', description: 'Yes prints the PDF in landscape. Default no.' }),
  };
}

function watchDropdown() {
  return Property.Dropdown({
    auth: rendexAuth,
    displayName: 'Watch',
    description: 'The watch to use. You can also map a Watch ID from List Watches or Create Watch.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Rendex account first' };
      }
      try {
        const watches = await rendexClient.listAllWatches({ auth });
        return {
          disabled: false,
          options: watches.map((watch) => ({ label: watchLabel(watch), value: String(watch['id']) })),
          placeholder: watches.length === 0 ? 'No watches yet. Create one with Create Watch.' : undefined,
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message.slice(0, 300) : 'Could not load watches from Rendex.',
        };
      }
    },
  });
}

function watchLabel(watch: Record<string, unknown>): string {
  const url = rendexInput.optionalText(watch['url']) ?? String(watch['id']);
  const name = rendexInput.optionalText(watch['name']);
  const status = rendexInput.optionalText(watch['status']);
  const lead = name === undefined ? url : `${name} (${url})`;
  return status === undefined ? lead : `${lead} [${status}]`;
}

function watchSettingProps() {
  return {
    diff_mode: choice({ displayName: 'Change Detection', description: 'What counts as a change. Default Visual and text.', values: DIFF_MODE_OPTIONS }),
    threshold: Property.Number({ displayName: 'Threshold', description: 'Visual sensitivity, 0 to 1. Default 0.01 alerts on any visual change; 0.06 or more alerts only on major changes.', required: false }),
    full_page: yesNo({ displayName: 'Full Page', description: 'Yes watches the whole scrollable page, no only the viewport. Default yes for watches.' }),
    selector: Property.ShortText({ displayName: 'Element Selector', description: 'CSS selector of one element to watch instead of the whole page, like #price.', required: false }),
    device: choice({ displayName: 'Device', description: 'Device preset for each check. Default desktop.', values: DEVICE_OPTIONS }),
    dark_mode: yesNo({ displayName: 'Dark Mode', description: 'Yes renders with prefers-color-scheme: dark.' }),
    hide_selectors: Property.Array({ displayName: 'Hide Elements', description: 'CSS selectors to hide before each check, like .ad-slot (up to 50).', required: false }),
    ignore_text: Property.Array({ displayName: 'Ignore Text', description: 'Text or /regex/ removed before the text comparison, like timestamps or counters (up to 50).', required: false }),
    wait_until: choice({ displayName: 'Wait Until', description: 'When the page counts as loaded.', values: WAIT_UNTIL_OPTIONS }),
    delay_ms: Property.Number({ displayName: 'Delay (ms)', description: 'Extra wait after load, 0 to 10000 ms.', required: false }),
  };
}

function screenshotBody({ values, source }: { values: Record<string, unknown>; source: Source }): Record<string, unknown> {
  const format = rendexInput.choiceOf({ value: values['format'], label: 'Format', allowed: FORMAT_VALUES });
  return rendexInput.compact({
    [source.key]: source.value,
    data: rendexInput.templateDataOf({ value: values['template_data'], source }),
    format,
    width: rendexInput.numberOf({ value: values['width'], ...RENDEX_LIMITS.WIDTH }),
    height: rendexInput.numberOf({ value: values['height'], ...RENDEX_LIMITS.HEIGHT }),
    fullPage: rendexInput.flagOf({ value: values['full_page'], label: 'Full Page' }),
    selector: rendexInput.textOf({ value: values['selector'], label: 'Element Selector', maxLength: 500 }),
    waitUntil: source.key === 'url' ? undefined : 'load',
  });
}

function pageOptions({ values }: { values: Record<string, unknown> }): Record<string, unknown> {
  return rendexInput.compact({
    device: rendexInput.choiceOf({ value: values['device'], label: 'Device', allowed: DEVICE_VALUES }),
    waitUntil: rendexInput.choiceOf({ value: values['wait_until'], label: 'Wait Until', allowed: WAIT_UNTIL_VALUES }),
    timeout: rendexInput.numberOf({ value: values['timeout_seconds'], ...RENDEX_LIMITS.TIMEOUT }),
    blockCookieBanners: rendexInput.flagOf({ value: values['block_cookie_banners'], label: 'Hide Cookie Banners' }),
    hideSelectors: rendexInput.textListOf({ value: values['hide_selectors'], label: 'Hide Elements', maxItems: 50, maxLength: 500 }),
  });
}

function watchSettings({ values }: { values: Record<string, unknown> }): { settings: Record<string, unknown>; renderParams: Record<string, unknown> } {
  const settings = rendexInput.compact({
    diffMode: rendexInput.choiceOf({ value: values['diff_mode'], label: 'Change Detection', allowed: DIFF_MODE_VALUES }),
    threshold: rendexInput.numberOf({ value: values['threshold'], ...RENDEX_LIMITS.THRESHOLD }),
  });
  const renderParams = rendexInput.compact({
    fullPage: rendexInput.flagOf({ value: values['full_page'], label: 'Full Page' }),
    selector: rendexInput.textOf({ value: values['selector'], label: 'Element Selector', maxLength: 500 }),
    device: rendexInput.choiceOf({ value: values['device'], label: 'Device', allowed: DEVICE_VALUES }),
    darkMode: rendexInput.flagOf({ value: values['dark_mode'], label: 'Dark Mode' }),
    hideSelectors: rendexInput.textListOf({ value: values['hide_selectors'], label: 'Hide Elements', maxItems: 50, maxLength: 500 }),
    ignoreText: rendexInput.textListOf({ value: values['ignore_text'], label: 'Ignore Text', maxItems: 50, maxLength: 500 }),
    waitUntil: rendexInput.choiceOf({ value: values['wait_until'], label: 'Wait Until', allowed: WAIT_UNTIL_VALUES }),
    delay: rendexInput.numberOf({ value: values['delay_ms'], ...RENDEX_LIMITS.DELAY }),
  });
  return { settings, renderParams };
}

function watchUrlOf({ value }: { value: unknown }): string {
  const url = rendexInput.textOf({ value, label: 'Page URL', maxLength: 2048 });
  if (url === undefined) {
    throw new Error('Page URL is required.');
  }
  return url;
}

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const FORMAT_OPTIONS = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
  { label: 'PDF', value: 'pdf' },
];

const DEVICE_OPTIONS = [
  { label: 'Desktop', value: 'desktop' },
  { label: 'iPhone 15', value: 'iphone_15' },
  { label: 'iPhone SE', value: 'iphone_se' },
  { label: 'Pixel 8', value: 'pixel_8' },
  { label: 'iPad', value: 'ipad' },
  { label: 'iPad Pro', value: 'ipad_pro' },
];

const WAIT_UNTIL_OPTIONS = [
  { label: 'Load event', value: 'load' },
  { label: 'DOM content loaded', value: 'domcontentloaded' },
  { label: 'Network idle (0 connections)', value: 'networkidle0' },
  { label: 'Network idle (2 connections)', value: 'networkidle2' },
];

const PAPER_OPTIONS = [
  { label: 'A4', value: 'A4' },
  { label: 'Letter', value: 'Letter' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Tabloid', value: 'Tabloid' },
  { label: 'A3', value: 'A3' },
];

const DIFF_MODE_OPTIONS = [
  { label: 'Visual and text', value: 'both' },
  { label: 'Visual only', value: 'visual' },
  { label: 'Text only', value: 'text' },
];

const EXTRACT_FORMAT_OPTIONS = [
  { label: 'Markdown', value: 'markdown' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
];

const FORMAT_VALUES = FORMAT_OPTIONS.map((option) => option.value);
const DEVICE_VALUES = DEVICE_OPTIONS.map((option) => option.value);
const WAIT_UNTIL_VALUES = WAIT_UNTIL_OPTIONS.map((option) => option.value);
const PAPER_VALUES = PAPER_OPTIONS.map((option) => option.value);
const DIFF_MODE_VALUES = DIFF_MODE_OPTIONS.map((option) => option.value);
const EXTRACT_FORMAT_VALUES = EXTRACT_FORMAT_OPTIONS.map((option) => option.value);

export const rendexProps = {
  yesNo,
  choice,
  sourceProps,
  captureProps,
  pageProps,
  screenshotExtraProps,
  watchDropdown,
  watchSettingProps,
};

export const rendexParams = {
  screenshotBody,
  pageOptions,
  watchSettings,
  watchUrlOf,
};

export const RENDEX_OPTIONS = {
  FORMAT_OPTIONS,
  EXTRACT_FORMAT_OPTIONS,
  PAPER_OPTIONS,
  DIFF_MODE_OPTIONS,
  FORMAT_VALUES,
  DEVICE_VALUES,
  WAIT_UNTIL_VALUES,
  PAPER_VALUES,
  DIFF_MODE_VALUES,
  EXTRACT_FORMAT_VALUES,
};
