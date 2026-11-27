import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const startCrawlAction = createAction({
  auth: zenrowsAuth,
  name: "start_crawl",
  classification: "WRITE",
  displayName: "Start Crawl",
  description: "Crawl a site from one URL to find its pages, and optionally fetch their HTML.",
  audience: 'both',
  aiMetadata: {
    description: "Starts a crawl from one URL that follows links on the same domain and returns its crawl_id at once. Use it to discover the URLs of a site or section; use Create Batch Job when you already have the URLs. Read results with Get Crawl or Download Crawl Results. Each page fetched costs 1 to 25 credits, and each call starts a new crawl, so a retry duplicates the work.",
    idempotent: false,
  },
  props: {
    url: Property.ShortText({ displayName: "URL", description: "The start URL: a public http or https URL. The crawl starts on this exact URL and stays on its domain, subdomains included.", required: true }),
    depth: Property.Number({ displayName: "Depth", description: "How many link steps to follow from the start URL. At 1, the links on the start page. Omit it to follow links until max_items or max_pages stops the crawl.", required: false }),
    max_items: Property.Number({ displayName: "Max Items", description: "Stop after keeping this many URLs.", required: false, defaultValue: 100 }),
    max_pages: Property.Number({ displayName: "Max Pages", description: "Stop after fetching this many pages. Caps what the crawl costs. If both limits are reached together, stop_reason is max_pages.", required: false, defaultValue: 100 }),
    include_patterns: Property.Array({ displayName: "Include Patterns", description: "Keep, and follow, only URLs that contain one of these texts, such as /product/.", required: false }),
    exclude_patterns: Property.Array({ displayName: "Exclude Patterns", description: "Drop URLs that contain any of these texts, even when they match an include pattern.", required: false }),
    output_format: Property.StaticDropdown({ displayName: "Output Format", description: "HTML also fetches and keeps the HTML of each page found. Leave it empty to get URLs only.", required: false, options: { disabled: false, options: [{ label: "HTML", value: "html" }] } }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"POST","server":"https://api.zenrows.com/v1","path":"/crawls","key":"header","body":["url","depth","max_items","max_pages","include_patterns","exclude_patterns","output_format"]}, values: propsValue, files });
  },
});
