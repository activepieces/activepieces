import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessOutputSchemas } from '../output-schemas';

export const getPageContent = createAction({
    auth: browserlessAuth,
    name: 'get_page_content',
    classification: 'READ',
    displayName: 'Get Page Content',
    description: 'Load a page in a real browser and return its rendered HTML.',
    propertyGroups: [
        { key: 'page', display: 'section', label: 'Page', icon: 'send', props: ['url', 'waitUntil'] },
        { key: 'wait', display: 'section', label: 'Wait for the page', icon: 'calendar', props: ['waitForSelector', 'navigationTimeout', 'waitForTimeout'] },
    ],
    audience: 'both',
    aiMetadata: {
        description:
            'Loads a URL in a headless browser and returns the final rendered HTML after JavaScript runs, plus the HTTP status the site answered with. Use only when you need the raw HTML of a JavaScript-heavy page; to read or summarise a page prefer Smart Scrape (markdown, much shorter), and use Scrape URL for specific CSS selectors. HTML is cut to Maximum Characters (default 100000) and truncated=true says so. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'The page to load.' }),
        waitUntil: browserlessProps.waitUntil(),
        navigationTimeout: browserlessProps.navigationTimeout(),
        waitForSelector: browserlessProps.waitForSelector(),
        waitForTimeout: browserlessProps.waitForTimeout(),
        rejectResourceTypes: Property.StaticMultiSelectDropdown({
            displayName: 'Skip Resource Types',
            description: 'Files the browser skips, so the page loads faster.',
            required: false,
            advanced: true,
            options: {
                options: [
                    { label: 'Images', value: 'image' },
                    { label: 'Stylesheets', value: 'stylesheet' },
                    { label: 'Fonts', value: 'font' },
                    { label: 'Video and Audio', value: 'media' },
                ],
            },
        }),
        bestAttempt: browserlessProps.bestAttempt({ advanced: true }),
        blockAds: browserlessProps.blockAds({ advanced: true }),
        maxCharacters: browserlessProps.maxCharacters({ advanced: true }),
        timeout: browserlessProps.sessionTimeout({ advanced: true }),
    },
    outputSchema: browserlessOutputSchemas.getPageContent,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });
        const rejectResourceTypes = browserlessBody.textList(props.rejectResourceTypes);
        const maxCharacters = browserlessBody.maxCharacters(props.maxCharacters);

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/content',
            body: {
                url,
                ...browserlessBody.pageOptions(props),
                ...(rejectResourceTypes.length > 0 ? { rejectResourceTypes } : {}),
            },
            query: { blockAds: props.blockAds === true ? true : undefined, timeout },
            responseType: 'text',
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Get Page Content',
        });

        const html = typeof response.body === 'string' ? response.body : JSON.stringify(response.body ?? '');
        const capped = browserlessBody.cap({ text: html, max: maxCharacters });
        return {
            url,
            ...browserlessApi.siteResponse(response.headers),
            html: capped.text,
            html_length: html.length,
            truncated: capped.truncated,
        };
    },
});

