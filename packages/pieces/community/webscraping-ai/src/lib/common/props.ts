import { Property } from '@activepieces/pieces-framework';

function pageRequest() {
	return {
		url: Property.ShortText({
			displayName: 'URL',
			description: 'The page to load, including https://.',
			placeholder: 'https://example.com/products/42',
			required: true,
		}),
		headers: Property.Array({
			displayName: 'Custom Headers',
			description: 'Extra HTTP headers to send with the page request.',
			required: false,
			properties: {
				name: Property.ShortText({
					displayName: 'Header Name',
					placeholder: 'User-Agent',
					required: true,
				}),
				value: Property.ShortText({
					displayName: 'Header Value',
					placeholder: 'Mozilla/5.0',
					required: true,
				}),
			},
		}),
		timeout: Property.Number({
			displayName: 'Timeout',
			description: 'Milliseconds to wait for the page to load, up to 30000.',
			required: false,
			advanced: true,
			defaultValue: 10000,
		}),
		js: Property.Checkbox({
			displayName: 'Enable JavaScript',
			description: "Run the page's scripts so dynamic content loads.",
			advanced: true,
			defaultValue: true,
			required: false,
		}),
		jsTimeout: Property.Number({
			displayName: 'JavaScript Timeout',
			description: 'Milliseconds to wait for scripts after the page loads.',
			required: false,
			advanced: true,
			defaultValue: 2000,
		}),
		waitFor: Property.ShortText({
			displayName: 'Wait For',
			description: 'CSS selector to wait for before reading the page.',
			placeholder: '.content-loaded',
			required: false,
			advanced: true,
		}),
		proxy: Property.StaticDropdown({
			displayName: 'Proxy Type',
			description: 'Which proxy network loads the page.',
			required: false,
			advanced: true,
			display: 'cards',
			defaultValue: 'datacenter',
			options: {
				options: [
					{ label: 'Datacenter', value: 'datacenter', description: 'Fast, cheaper' },
					{ label: 'Residential', value: 'residential', description: 'Hard to block' },
				],
			},
		}),
		country: Property.StaticDropdown({
			displayName: 'Proxy Country',
			description: 'Country the proxy connects from.',
			required: false,
			advanced: true,
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
			description: 'Your own proxy, used instead of the built-in ones.',
			placeholder: 'http://user:password@host:port',
			required: false,
			advanced: true,
		}),
		jsScript: Property.LongText({
			displayName: 'JavaScript Code',
			description: 'JavaScript to run on the page after it loads.',
			placeholder: "document.querySelector('button').click()",
			required: false,
			advanced: true,
		}),
	};
}

function pageOptions() {
	return {
		device: Property.StaticDropdown({
			displayName: 'Device Type',
			description: 'Device the page is loaded as. Empty: desktop.',
			required: false,
			advanced: true,
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
			description: 'Fail the step when the page returns 404 Not Found.',
			required: false,
			advanced: true,
		}),
		errorOnRedirect: Property.Checkbox({
			displayName: 'Error on Redirect',
			description: 'Fail the step when the page redirects to another URL.',
			required: false,
			advanced: true,
		}),
	};
}

function format() {
	return Property.StaticDropdown({
		displayName: 'Response Format',
		description: 'JSON wraps the result in an object with a result key.',
		required: false,
		display: 'cards',
		defaultValue: 'text',
		options: {
			options: [
				{ label: 'Text', value: 'text', description: 'Result only', icon: 'text' },
				{ label: 'JSON', value: 'json', description: 'As an object', icon: 'code' },
			],
		},
	});
}

export const webscrapingAiProps = { pageRequest, pageOptions, format };
