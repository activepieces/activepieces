import { Action, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wsaiPaths, wsaiRequest, WebScrapingAiAuth } from '../common/client';

export const getPageHtml: Action = createAction({
    name: 'get_page_html',
    displayName: 'Get Page HTML',
    description: 'Retrieves the raw HTML markup of a web page.',
    props: {
        url: Property.ShortText({ displayName: 'URL', required: true }),
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
        return_script_result: Property.Checkbox({ displayName: 'Return JS result instead of HTML', required: false }),
        format: Property.Dropdown({
            displayName: 'Response Format',
            required: false,
            refreshers: [],
            options: async () => ({
                disabled: false,
                options: [ 'json','text' ].map(f => ({ value: f, label: f })),
            }),
        })
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
                case 'return_script_result':
                    if (value !== undefined) queryParams[key] = String(Boolean(value))
                    break
                case 'wait_for':
                case 'proxy':
                case 'country':
                case 'custom_proxy':
                case 'device':
                case 'js_script':
                case 'format':
                    if (value) queryParams[key] = String(value)
                    break
                case 'headers':
                    if (value) queryParams[key] = JSON.stringify(value)
                    break
                default:
                    break
            }
        }
        const body = await wsaiRequest<string>({
            method: HttpMethod.GET,
            path: wsaiPaths.html,
            auth,
            queryParams,
            headers: { accept: 'text/html' },
        })
        return body
    },
})


