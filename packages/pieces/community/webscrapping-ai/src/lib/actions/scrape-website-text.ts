import { Action, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wsaiPaths, wsaiRequest, WebScrapingAiAuth } from '../common/client';

export const scrapeWebsiteText: Action = createAction({
    name: 'scrape_website_text',
    displayName: 'Scrape Website Text',
    description: 'Returns the visible text content of a webpage specified by the URL. Supports plain, JSON, or XML output.',
    props: {
        url: Property.ShortText({ displayName: 'URL', required: true }),
        text_format: Property.Dropdown({
            displayName: 'Text Format',
            required: false,
            refreshers: [],
            options: async () => ({
                disabled: false,
                options: [ 'plain','json','xml' ].map(x => ({ value: x, label: x })),
            }),
        }),
        return_links: Property.Checkbox({ displayName: 'Return links (for JSON format)', required: false }),
        headers: Property.Json({ displayName: 'Headers (JSON object)', required: false }),
        timeout: Property.Number({ displayName: 'Timeout (ms)', required: false }),
        js: Property.Checkbox({ displayName: 'Render JavaScript', required: false, defaultValue: true }),
        js_timeout: Property.Number({ displayName: 'JS Timeout (ms)', required: false }),
        wait_for: Property.ShortText({ displayName: 'Wait for CSS selector', required: false }),
        proxy: Property.Dropdown({
            displayName: 'Proxy Type',
            required: false,
            refreshers: [],
            options: async () => ({
                disabled: false,
                options: [
                    { value: 'datacenter', label: 'datacenter' },
                    { value: 'residential', label: 'residential' },
                ],
            }),
        }),
        country: Property.Dropdown({
            displayName: 'Proxy Country',
            required: false,
            refreshers: [],
            options: async () => ({
                disabled: false,
                options: [ 'us','gb','de','it','fr','ca','es','ru','jp','kr','in' ].map(c => ({ value: c, label: c })),
            }),
        }),
        custom_proxy: Property.ShortText({ displayName: 'Custom Proxy URL', required: false }),
        device: Property.Dropdown({
            displayName: 'Device',
            required: false,
            refreshers: [],
            options: async () => ({
                disabled: false,
                options: [ 'desktop','mobile','tablet' ].map(d => ({ value: d, label: d })),
            }),
        }),
        error_on_404: Property.Checkbox({ displayName: 'Error on 404', required: false }),
        error_on_redirect: Property.Checkbox({ displayName: 'Error on redirect', required: false }),
        js_script: Property.LongText({ displayName: 'Custom JS to run', required: false }),
        format: Property.StaticDropdown({ displayName: 'Response Format', required: false, options: { options: [
            { value: 'json', label: 'json' },
            { value: 'text', label: 'text' },
        ]}})
    },
    async run(context) {
        const propsValue = context.propsValue as any
        const auth: WebScrapingAiAuth = { apiKey: (context.auth as any).apiKey as string }
        const queryParams: Record<string, string> = { url: propsValue.url as string }
        const entries = Object.entries(propsValue)
        for (const [key, value] of entries) {
            switch (key) {
                case 'timeout':
                case 'js_timeout':
                    if (value !== undefined) queryParams[key] = String(value)
                    break
                case 'js':
                case 'error_on_404':
                case 'error_on_redirect':
                case 'return_links':
                    if (value !== undefined) queryParams[key] = String(Boolean(value))
                    break
                case 'wait_for':
                case 'proxy':
                case 'country':
                case 'custom_proxy':
                case 'device':
                case 'js_script':
                case 'format':
                case 'text_format':
                    if (value) queryParams[key] = String(value)
                    break
                case 'headers':
                    if (value) queryParams[key] = JSON.stringify(value)
                    break
                default:
                    break
            }
        }
        const result = await wsaiRequest<any>({
            method: HttpMethod.GET,
            path: wsaiPaths.text,
            auth,
            queryParams,
        })
        return result
    },
})


