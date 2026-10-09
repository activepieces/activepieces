import { Property } from '@activepieces/pieces-framework';

function scrapePage() {
	return {
		url: Property.ShortText({
			displayName: 'URL',
			description:
				'Full URL of the target page, including the scheme, e.g. "https://example.com/pricing".',
			required: true,
		}),
		headers: Property.Object({
			displayName: 'Headers',
			description:
				'HTTP headers to send to the target page, as header name → value, e.g. {"Cookie": "session=abc"}.',
			required: false,
		}),
		timeout: Property.Number({
			displayName: 'Timeout',
			description: 'Maximum page load time in milliseconds, 1-25000. Defaults to 10000.',
			required: false,
		}),
		js: Property.Checkbox({
			displayName: 'Render JavaScript',
			description:
				'Render the page in a headless browser. Defaults to true; set false for static pages to save credits.',
			required: false,
		}),
		jsTimeout: Property.Number({
			displayName: 'JavaScript Timeout',
			description: 'Maximum JavaScript rendering time in milliseconds, 1-20000. Defaults to 2000.',
			required: false,
		}),
		waitFor: Property.ShortText({
			displayName: 'Wait For',
			description: 'CSS selector to wait for before returning, e.g. ".content-loaded".',
			required: false,
		}),
		proxy: Property.StaticDropdown({
			displayName: 'Proxy Type',
			description:
				'Proxy tier. "datacenter" (default, cheapest), "residential" for sites blocking datacenter IPs, "stealth" for heavily protected sites (most expensive), "auto" tries each tier in turn. "auto" cannot be combined with Custom Proxy.',
			required: false,
			options: {
				options: [
					{ label: 'Datacenter', value: 'datacenter' },
					{ label: 'Residential', value: 'residential' },
					{ label: 'Stealth', value: 'stealth' },
					{ label: 'Auto', value: 'auto' },
				],
			},
		}),
		country: Property.StaticDropdown({
			displayName: 'Proxy Country',
			description: 'Country of the proxy used to fetch the page. Defaults to "us".',
			required: false,
			options: {
				options: [
					{ label: 'United States', value: 'us' },
					{ label: 'United Kingdom', value: 'gb' },
					{ label: 'Germany', value: 'de' },
					{ label: 'Italy', value: 'it' },
					{ label: 'France', value: 'fr' },
					{ label: 'Canada', value: 'ca' },
					{ label: 'Spain', value: 'es' },
					{ label: 'Russia', value: 'ru' },
					{ label: 'Japan', value: 'jp' },
					{ label: 'South Korea', value: 'kr' },
					{ label: 'India', value: 'in' },
					{ label: 'Hong Kong', value: 'hk' },
					{ label: 'Turkey', value: 'tr' },
				],
			},
		}),
		customProxy: Property.ShortText({
			displayName: 'Custom Proxy',
			description:
				'Your own proxy URL, e.g. "http://user:password@host:port". Overrides Proxy Type.',
			required: false,
		}),
		device: Property.StaticDropdown({
			displayName: 'Device',
			description: 'Device to emulate. Defaults to "desktop".',
			required: false,
			options: {
				options: [
					{ label: 'Desktop', value: 'desktop' },
					{ label: 'Mobile', value: 'mobile' },
					{ label: 'Tablet', value: 'tablet' },
				],
			},
		}),
		errorOn404: Property.Checkbox({
			displayName: 'Error on 404',
			description: 'Fail when the target page returns 404. Defaults to false.',
			required: false,
		}),
		errorOnRedirect: Property.Checkbox({
			displayName: 'Error on Redirect',
			description: 'Fail when the target page redirects. Defaults to false.',
			required: false,
		}),
	};
}

function pageScript() {
	return {
		jsScript: Property.LongText({
			displayName: 'JavaScript Code',
			description:
				'JavaScript to run on the page after it loads, e.g. document.querySelector("button").click(). The result is the value of the last expression; a top-level "return" is a syntax error.',
			required: false,
		}),
		returnScriptResult: Property.Checkbox({
			displayName: 'Return Script Result',
			description: 'Return the JavaScript Code result instead of the page HTML. Defaults to false.',
			required: false,
		}),
	};
}

function postRequest() {
	return {
		body: Property.LongText({
			displayName: 'Request Body',
			description:
				'Raw body forwarded to the target URL as a POST, e.g. {"username": "test"}. For a form-encoded body, use Content Type "text/plain" and set the header "Content-Type: application/x-www-form-urlencoded".',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Content type of the Request Body as sent to the target.',
			required: true,
			defaultValue: 'application/json',
			options: {
				options: [
					{ label: 'JSON', value: 'application/json' },
					{ label: 'Plain Text', value: 'text/plain' },
				],
			},
		}),
	};
}

function returnLinks() {
	return Property.Checkbox({
		displayName: 'Return Links',
		description: 'Also return the links found in the page body. Defaults to false.',
		required: false,
	});
}

function selector() {
	return Property.ShortText({
		displayName: 'Selector',
		description: 'CSS selector of the element to return, e.g. "h1", ".price", "#main".',
		required: true,
	});
}

function selectors() {
	return Property.Array({
		displayName: 'Selectors',
		description: 'CSS selectors, one per item, e.g. ["h1", ".price"].',
		required: true,
	});
}

export const webscrapingAiAiProps = {
	scrapePage,
	pageScript,
	postRequest,
	returnLinks,
	selector,
	selectors,
};
