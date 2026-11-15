import { Property } from '@activepieces/pieces-framework';

function pageRequest() {
	return {
		url: Property.ShortText({
			displayName: 'URL',
			description: 'URL of the target page.',
			required: true,
		}),
		headers: Property.Array({
			displayName: 'Custom Headers',
			description: 'Add custom HTTP headers (optional)',
			required: false,
			properties: {
				name: Property.ShortText({
					displayName: 'Header Name',
					description: 'Header name (e.g., User-Agent, Authorization)',
					required: true,
				}),
				value: Property.ShortText({
					displayName: 'Header Value',
					description: 'Header value',
					required: true,
				}),
			},
		}),
		timeout: Property.Number({
			displayName: 'Timeout',
			description: 'Maximum page load time in milliseconds (default: 10000, max: 30000)',
			required: false,
			defaultValue: 10000,
		}),
		js: Property.Checkbox({
			displayName: 'Enable JavaScript',
			description: 'Execute JavaScript for dynamic content (recommended)',
			defaultValue: true,
			required: false,
		}),
		jsTimeout: Property.Number({
			displayName: 'JavaScript Timeout',
			description: 'Maximum JavaScript execution time in milliseconds (default: 2000)',
			required: false,
			defaultValue: 2000,
		}),
		waitFor: Property.ShortText({
			displayName: 'Wait For',
			description: 'CSS selector to wait for dynamic content (e.g., ".content-loaded")',
			required: false,
		}),
		proxy: Property.StaticDropdown({
			displayName: 'Proxy Type',
			description: 'Use residential proxies for sites that block datacenter IPs (more expensive)',
			required: false,
			defaultValue: 'datacenter',
			options: {
				options: [
					{ label: '🏢 Datacenter (Fast)', value: 'datacenter' },
					{ label: '🏠 Residential (Stealth)', value: 'residential' },
				],
			},
		}),
		country: Property.StaticDropdown({
			displayName: 'Proxy Country',
			description: 'Geographic location of the proxy server',
			required: false,
			defaultValue: 'us',
			options: {
				options: [
					{ label: 'United States', value: 'us' },
					{ label: 'Canada', value: 'ca' },
					{ label: 'United Kingdom', value: 'gb' },
					{ label: 'Germany', value: 'de' },
					{ label: 'France', value: 'fr' },
					{ label: 'Italy', value: 'it' },
					{ label: 'Spain', value: 'es' },
					{ label: 'Russia', value: 'ru' },
					{ label: 'Japan', value: 'jp' },
					{ label: 'South Korea', value: 'kr' },
					{ label: 'India', value: 'in' },
				],
			},
		}),
		customProxy: Property.ShortText({
			displayName: 'Custom Proxy',
			description: 'Your proxy URL in format: http://user:password@host:port',
			required: false,
		}),
		jsScript: Property.LongText({
			displayName: 'JavaScript Code',
			description: 'Custom JavaScript to execute (e.g., document.querySelector("button").click())',
			required: false,
		}),
	};
}

function pageOptions() {
	return {
		device: Property.StaticDropdown({
			displayName: 'Device Type',
			description: 'Emulate specific device for responsive design testing',
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
			description: 'Fail the action if the page returns a 404 error',
			required: false,
		}),
		errorOnRedirect: Property.Checkbox({
			displayName: 'Error on Redirect',
			description: 'Fail the action if the page redirects to another URL',
			required: false,
		}),
	};
}

function format() {
	return Property.StaticDropdown({
		displayName: 'Response Format',
		description: 'Response format: Text (simple) or JSON (structured)',
		required: false,
		defaultValue: 'text',
		options: {
			options: [
				{ label: 'Text', value: 'text' },
				{ label: 'JSON', value: 'json' },
			],
		},
	});
}

export const webscrapingAiProps = { pageRequest, pageOptions, format };
