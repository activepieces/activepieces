import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const extractAction = createAction({
  auth: zenrowsAuth,
  name: "extract",
  classification: "READ",
  displayName: "Extract Structured Data",
  description: "Get a page's data as JSON without writing selectors, or map your own fields to CSS selectors.",
  audience: 'both',
  aiMetadata: {
    description: "Fetches one page and returns its data as structured JSON: extract=auto returns the site's own field names, or css_extractor maps your keys to CSS selectors. Pick it when you need specific fields; use Scrape URL for the whole page as Markdown or HTML. A domain Extract has not prepared yet answers REQS007: prepare it with Request Extract Domain. Billed as the request it runs; safe to retry.",
    idempotent: true,
  },
  props: {
    url: Property.ShortText({ displayName: "URL", description: "The URL of the page to retrieve. Only http and https URLs are accepted.", required: true }),
    extract: Property.StaticDropdown({ displayName: "Extract", description: "Auto and Native return the website's own field names; Standard returns one schema shared by every site in a vertical (real estate only for now). Leave it empty to use CSS Extractor instead. A domain that isn't prepared yet fails with REQS007: prepare it with Request Extract Domain.", required: false, options: { disabled: false, options: [{ label: "Auto", value: "auto" }, { label: "Native", value: "native" }, { label: "Standard", value: "standard" }] } }),
    extract_fields: Property.ShortText({ displayName: "Extract Fields", description: "Comma-separated list of the fields extract should return, dot-notated for fields inside a group (for example products.name,products.price). Omit it to receive every field.", required: false }),
    css_extractor: Property.ShortText({ displayName: "CSS Extractor", description: "JSON object mapping output keys to CSS selectors, applied to the retrieved page.", required: false }),
    mode: Property.StaticDropdown({ displayName: "Mode", description: "Adaptive Stealth Mode. auto starts from the cheapest viable configuration and escalates to JavaScript rendering or premium proxies only when the target requires it. You are billed for the configuration that succeeds. It manages js_render and premium_proxy itself, so setting either alongside it answers 400 REQS004; proxy_country is allowed.", required: false, options: { disabled: false, options: [{ label: "Auto", value: "auto" }] } }),
    js_render: Property.Checkbox({ displayName: "JS Render", description: "Render the page in a headless browser before returning it. Required for content that only exists after JavaScript runs. Not allowed with mode=auto (400 REQS004).", required: false, defaultValue: false }),
    premium_proxy: Property.Checkbox({ displayName: "Premium Proxy", description: "Route the request through residential IPs. Required by most protected sites. Not allowed with mode=auto (400 REQS004).", required: false, defaultValue: false }),
    proxy_country: Property.ShortText({ displayName: "Proxy Country", description: "Two-letter country code for the exit IP. Requires premium_proxy=true or mode=auto, which then routes through premium proxies, so the request costs at least 10 credits. Alone, or with only js_render, the request answers 400 REQS004.", required: false }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://api.zenrows.com/v1","path":"/","key":"query","binary":true,"query":["url","extract","extract_fields","css_extractor","mode","js_render","premium_proxy","proxy_country"]}, values: propsValue, files });
  },
});
