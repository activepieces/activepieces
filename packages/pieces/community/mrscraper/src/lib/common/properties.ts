import { Property } from '@activepieces/pieces-framework';

const mode = Property.StaticDropdown({
  displayName: 'Mode',
  description: 'Scraping mode. Super handles stronger protection; Cheap is intended for simpler sites.',
  required: false,
  defaultValue: 'Super',
  options: { options: [{ label: 'Super', value: 'Super' }, { label: 'Cheap', value: 'Cheap' }] },
});

const url = Property.ShortText({
  displayName: 'URL',
  description: 'Absolute http or https URL to process, for example https://example.com/products/123.',
  required: true,
});

const proxyCountry = Property.ShortText({
  displayName: 'Proxy Country',
  description: 'Optional ISO country code for the proxy, for example US, GB, ID, or SG.',
  required: false,
});

const prompt = Property.LongText({
  displayName: 'Prompt',
  description: 'Optional instructions describing the data to extract.',
  required: false,
});

const outputSchema = Property.Json({
  displayName: 'Output Schema',
  description: 'Optional JSON object describing the expected output, for example {"name":"string","price":"number"}.',
  required: false,
});

const map = {
  url,
  max_depth: Property.Number({ displayName: 'Max Depth', description: 'Maximum crawl depth. Default: 2.', required: false, defaultValue: 2, step: 1 }),
  max_pages: Property.Number({ displayName: 'Max Pages', description: 'Maximum pages to evaluate. Default: 50.', required: false, defaultValue: 50, step: 1 }),
  limit: Property.Number({ displayName: 'Limit', description: 'Maximum URLs to return. Default: 50; minimum: 1.', required: false, defaultValue: 50, min: 1, step: 1 }),
  include_patterns: Property.LongText({ displayName: 'Include Patterns', description: 'Optional pipe-separated regular expressions for URLs to include.', required: false }),
  exclude_patterns: Property.LongText({ displayName: 'Exclude Patterns', description: 'Optional pipe-separated regular expressions for URLs to exclude.', required: false }),
};

const general = {
  url,
  prompt,
  output_schema: outputSchema,
  mode,
  proxy_country: proxyCountry,
};

const listing = {
  url,
  prompt,
  output_schema: outputSchema,
  max_pages: Property.Number({ displayName: 'Max Pages', description: 'Maximum pagination pages to scrape. Default: 1; minimum: 1.', required: false, defaultValue: 1, min: 1, step: 1 }),
  proxy_country: proxyCountry,
};

const runExisting = {
  scraper_type: Property.StaticDropdown({
    displayName: 'Scraper Type',
    description: 'Select AI or Manual so the run uses the matching endpoint and settings.',
    required: true,
    defaultValue: 'ai',
    display: 'cards',
    options: { options: [
      { label: 'AI', value: 'ai', description: 'Run an AI scraper.', icon: 'blank' },
      { label: 'Manual', value: 'manual', description: 'Run a manual-selector scraper.', icon: 'blank' },
    ] },
  }),
  scraper_id: Property.ShortText({ displayName: 'Scraper ID', description: 'Existing scraper ID from the MrScraper scraper detail page, for example cm123abc456.', required: true }),
  url,
  max_retry: Property.Number({ displayName: 'Max Retry', description: 'Maximum retry attempts. Default: 3; minimum: 0.', required: false, defaultValue: 3, min: 0, step: 1 }),
  proxy_country: proxyCountry,
  agent_type: Property.StaticDropdown({
    displayName: 'AI Agent Type',
    description: 'Select the AI agent type to display only its supported settings.',
    required: false,
    defaultValue: 'general',
    displayOptions: { show: { scraper_type: ['ai'] } },
    options: { options: [{ label: 'General', value: 'general' }, { label: 'Listing', value: 'listing' }, { label: 'Map', value: 'map' }] },
  }),
  max_pages: Property.Number({ displayName: 'AI Max Pages', description: 'Maximum pages for a Listing or Map run.', required: false, min: 1, step: 1, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['listing', 'map'] } } }),
  timeout: Property.Number({ displayName: 'Run Timeout', description: 'Maximum run time in seconds.', required: false, min: 1, step: 1, displayOptions: { show: [{ scraper_type: ['ai'], agent_type: ['listing'] }, { scraper_type: ['manual'] }] } }),
  bypass_proxy: Property.Checkbox({ displayName: 'Bypass Proxy', description: 'Skip loading images, fonts, and stylesheets.', required: false, defaultValue: false, advanced: true, displayOptions: { show: [{ scraper_type: ['ai'], agent_type: ['general', 'listing'] }, { scraper_type: ['manual'] }] } }),
  html: Property.Checkbox({ displayName: 'Return HTML', description: 'Include HTML in the result.', required: false, defaultValue: false, advanced: true, displayOptions: { show: [{ scraper_type: ['ai'], agent_type: ['general', 'listing'] }, { scraper_type: ['manual'] }] } }),
  markdown: Property.Checkbox({ displayName: 'Return Markdown', description: 'Include Markdown in the result.', required: false, defaultValue: false, advanced: true, displayOptions: { show: [{ scraper_type: ['ai'], agent_type: ['general', 'listing'] }, { scraper_type: ['manual'] }] } }),
  render_javascript: Property.Checkbox({ displayName: 'Render JavaScript', description: 'Render JavaScript before extracting content.', required: false, defaultValue: false, advanced: true, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['general', 'listing'] } } }),
  return_cookies: Property.Checkbox({ displayName: 'Return Cookies', description: 'Include browser cookies in the result.', required: false, defaultValue: false, advanced: true, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['general', 'listing'] } } }),
  screenshot: Property.Checkbox({ displayName: 'Screenshot', description: 'Capture a screenshot during the run.', required: false, defaultValue: false, advanced: true, displayOptions: { show: [{ scraper_type: ['ai'], agent_type: ['general', 'listing'] }, { scraper_type: ['manual'] }] } }),
  stream: Property.Checkbox({ displayName: 'Stream', description: 'Stream results as they become available.', required: false, defaultValue: false, advanced: true, displayOptions: { show: [{ scraper_type: ['ai'], agent_type: ['listing'] }, { scraper_type: ['manual'] }] } }),
  use_home_page: Property.Checkbox({ displayName: 'Use Home Page', description: 'Visit the home page before the target URL.', required: false, defaultValue: false, advanced: true, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['general', 'listing'] } } }),
  wait_for_selector: Property.ShortText({ displayName: 'Wait for Selector', description: 'CSS selector to wait for before extraction, such as #product-list.', required: false, advanced: true, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['general', 'listing'] } } }),
  max_depth: Property.Number({ displayName: 'Map Max Depth', description: 'Maximum Map crawl depth.', required: false, min: 0, step: 1, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['map'] } } }),
  limit: Property.Number({ displayName: 'Map Limit', description: 'Maximum URLs returned by a Map run.', required: false, min: 1, step: 1, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['map'] } } }),
  include_patterns: Property.LongText({ displayName: 'Map Include Patterns', description: 'Optional pipe-separated regular expressions.', required: false, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['map'] } } }),
  exclude_patterns: Property.LongText({ displayName: 'Map Exclude Patterns', description: 'Optional pipe-separated regular expressions.', required: false, displayOptions: { show: { scraper_type: ['ai'], agent_type: ['map'] } } }),
  cookie_jar: Property.LongText({ displayName: 'Manual Cookie Jar', description: 'Optional cookie jar identifier or serialized value.', required: false, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  cookies: Property.Array({
    displayName: 'Manual Cookies',
    description: 'Browser cookie objects sent as a JSON array.',
    required: false,
    defaultValue: [],
    advanced: true,
    displayOptions: { show: { scraper_type: ['manual'] } },
  }),
  home_page: Property.Checkbox({ displayName: 'Manual Home Page', description: 'Visit the site home page before the target URL.', required: false, defaultValue: false, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  home_page_timeout: Property.Number({ displayName: 'Manual Home Page Timeout', description: 'Maximum seconds to wait for the home page.', required: false, min: 1, step: 1, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  paginator: Property.Json({ displayName: 'Manual Paginator', description: 'JSON object containing pagination configuration.', required: false, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  proxy: Property.ShortText({ displayName: 'Manual Proxy', description: 'Optional proxy URL.', required: false, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  record: Property.Checkbox({ displayName: 'Record Manual Session', description: 'Record the manual browser session.', required: false, defaultValue: false, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  return_cookie: Property.Checkbox({ displayName: 'Return Manual Cookie', description: 'Return the manual browser cookie.', required: false, defaultValue: false, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
  token_cap: Property.Number({ displayName: 'Manual Token Cap', description: 'Maximum processing token allowance.', required: false, min: 0, step: 1, advanced: true, displayOptions: { show: { scraper_type: ['manual'] } } }),
};

export const mrscraperProperties = {
  none: {},
  map,
  serp: {
    query: Property.LongText({ displayName: 'Search Query', description: 'Google search terms, for example best hotels in New York.', required: true }),
    region: Property.ShortText({ displayName: 'Region', description: 'Two-letter region code, for example us or gb.', required: false, defaultValue: 'us' }),
    language: Property.ShortText({ displayName: 'Language', description: 'Two-letter language code, for example en or fr.', required: false, defaultValue: 'en' }),
    page: Property.Number({ displayName: 'Page', description: 'Google results page. Default: 1; minimum: 1.', required: false, defaultValue: 1, min: 1, step: 1 }),
    format: Property.StaticDropdown({ displayName: 'Format', description: 'Return structured JSON or the rendered Google results page as HTML.', required: false, defaultValue: 'json', display: 'cards', options: { options: [
      { label: 'JSON', value: 'json', description: 'Return structured search results.', icon: 'code' },
      { label: 'HTML', value: 'html', description: 'Return the results page as text.', icon: 'text' },
    ] } }),
    render_js: Property.Checkbox({ displayName: 'Render JavaScript', description: 'Render JavaScript before collecting results.', required: false, defaultValue: false }),
  },
  general,
  listing,
  structured: {
    url,
    category: Property.StaticDropdown({ displayName: 'Category', description: 'Preset schema used to extract structured data.', required: false, defaultValue: 'article', options: { options: [
      { label: 'Article', value: 'article' }, { label: 'Forum Thread', value: 'forumThread' }, { label: 'Hotel', value: 'hotel' },
      { label: 'Job Posting', value: 'jobPosting' }, { label: 'Post', value: 'post' }, { label: 'Product', value: 'product' },
      { label: 'Property', value: 'property' }, { label: 'Restaurant', value: 'restaurant' },
      { label: 'Social Media Profile', value: 'socialMediaProfile' }, { label: 'Tour / Attraction', value: 'tourAttraction' },
    ] } }),
    mode,
    proxy_country: proxyCountry,
  },
  rendered: {
    url,
    max_retries: Property.Number({ displayName: 'Max Retries', description: 'Maximum request retries. Default: 3; minimum: 0.', required: false, defaultValue: 3, min: 0, step: 1 }),
    timeout: Property.Number({ displayName: 'Timeout', description: 'Maximum page-load time in seconds. Default: 300; minimum: 1.', required: false, defaultValue: 300, min: 1, step: 1 }),
    geo_code: Property.ShortText({ displayName: 'Geo Code', description: 'Geolocation country code. Default: us.', required: false, defaultValue: 'us' }),
    proxy_country: Property.ShortText({ displayName: 'Proxy Country', description: 'Proxy country code. Default: us.', required: false, defaultValue: 'us' }),
    screenshot: Property.Checkbox({ displayName: 'Screenshot', description: 'Capture and return a screenshot.', required: false, defaultValue: false, reveals: ['screenshot_mode'] }),
    screenshot_mode: Property.StaticDropdown({ displayName: 'Screenshot Mode', description: 'Capture the full page or only its top.', required: false, defaultValue: 'full', options: { options: [{ label: 'Full', value: 'full' }, { label: 'Top', value: 'top' }] } }),
    html: Property.Checkbox({ displayName: 'Return HTML', required: false, defaultValue: false }),
    markdown: Property.Checkbox({ displayName: 'Return Markdown', required: false, defaultValue: false }),
    token_cap: Property.Number({ displayName: 'Token Cap', description: 'Maximum processing token allowance.', required: false, min: 1, step: 1, advanced: true }),
    wait_for_selector: Property.ShortText({ displayName: 'Wait for Selector', description: 'Optional CSS selector to wait for before returning.', required: false, advanced: true }),
    wait_until: Property.StaticDropdown({ displayName: 'Wait Until', description: 'Browser lifecycle event to await.', required: false, advanced: true, options: { options: [{ label: 'DOM Content Loaded', value: 'domcontentloaded' }, { label: 'Load', value: 'load' }, { label: 'Network Idle', value: 'networkidle' }] } }),
    block_resources: Property.Checkbox({ displayName: 'Block Resources', description: 'Block images, fonts, and stylesheets.', required: false, defaultValue: false, advanced: true }),
    home_page: Property.Checkbox({ displayName: 'Home Page', description: 'Visit the site home page before the target URL.', required: false, defaultValue: false, advanced: true }),
    return_cookie: Property.Checkbox({ displayName: 'Return Cookie', required: false, defaultValue: false, advanced: true }),
    super_mode: Property.Checkbox({ displayName: 'Super Mode', description: 'Use a real device for stronger scraping capabilities.', required: false, defaultValue: false, advanced: true }),
  },
  results: {
    scraper_id: Property.ShortText({ displayName: 'Scraper ID', description: 'Scraper ID whose results should be fetched.', required: true }),
    page: Property.Number({ displayName: 'Page', description: 'Page number. Default: 1.', required: false, defaultValue: 1, step: 1 }),
    page_size: Property.Number({ displayName: 'Page Size', description: 'Results per page. Default: 10.', required: false, defaultValue: 10, step: 1 }),
    sort_by: Property.StaticDropdown({ displayName: 'Sort By', required: false, defaultValue: 'createdAt', options: { options: [{ label: 'Created At', value: 'createdAt' }] } }),
    sort_order: Property.StaticDropdown({ displayName: 'Sort Order', required: false, defaultValue: 'DESC', options: { options: [{ label: 'Ascending', value: 'ASC' }, { label: 'Descending', value: 'DESC' }] } }),
  },
  latest: {
    scraper_id: Property.ShortText({ displayName: 'Scraper ID', description: 'Scraper ID whose latest results should be fetched.', required: true }),
    count: Property.Number({ displayName: 'Count', description: 'Number of latest results. Default: 10.', required: false, defaultValue: 10, step: 1 }),
  },
  detail: {
    result_id: Property.ShortText({ displayName: 'Result ID', description: 'Result ID to retrieve, for example result_01JABCDEF123456.', required: true }),
  },
  runExisting,
  batch: {
    scraper_type: Property.StaticDropdown({ displayName: 'Scraper Type', description: 'Select AI or Manual to use the matching bulk endpoint.', required: true, defaultValue: 'ai', options: { options: [{ label: 'AI', value: 'ai' }, { label: 'Manual', value: 'manual' }] } }),
    scraper_id: Property.ShortText({ displayName: 'Scraper ID', description: 'Existing scraper ID from MrScraper.', required: true }),
    urls: Property.Array({ displayName: 'URLs', description: 'At least one absolute URL. Expressions may also resolve to a JSON-array string or comma/newline-separated text.', required: true }),
  },
};
