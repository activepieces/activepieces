import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from './index';
import { isNil } from '@activepieces/shared';

export const sessionIdDropdown = Property.Dropdown({
    displayName: 'Session',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please connect your Airtop account.',
                options: [],
            };
        }
        try {
            const response = await airtopApiCall<any[]>({
                apiKey: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/sessions',
            });
            if (!response || response.length === 0) {
                return {
                    disabled: true,
                    placeholder: 'No sessions found. Please create a session first.',
                    options: [],
                };
            }
            return {
                disabled: false,
                options: response.map((session) => ({
                    label: session.name || session._id || `Session ${session._id}`,
                    value: session._id,
                })),
            };
        } catch (e) {
            return {
                disabled: true,
                placeholder: 'Failed to load sessions.',
                options: [],
            };
        }
    },
});

export const windowIdDropdown = Property.Dropdown({
    displayName: 'Window',
    required: true,
    refreshers: ['sessionId'],
    options: async ({ auth, sessionId }) => {
        if (!auth || !sessionId) {
            return {
                disabled: true,
                placeholder: 'Select a session first.',
                options: [],
            };
        }
        try {
            const response = await airtopApiCall<any[]>({
                apiKey: auth as string,
                method: HttpMethod.GET,
                resourceUri: `/sessions/${sessionId}/windows`,
            });
            if (!response || response.length === 0) {
                return {
                    disabled: true,
                    placeholder: 'No windows found in this session.',
                    options: [],
                };
            }
            return {
                disabled: false,
                options: response.map((window) => ({
                    label: window.name || window._id || `Window ${window._id}`,
                    value: window._id,
                })),
            };
        } catch (e) {
            return {
                disabled: true,
                placeholder: 'Failed to load windows.',
                options: [],
            };
        }
    },
});

export const selectorProperty = Property.ShortText({
    displayName: 'Element Selector or Text',
    required: true,
    description: 'CSS selector, XPath, or visible text to target an element.',
});

export const fileProperty = Property.File({
    displayName: 'File',
    required: true,
    description: 'File to upload to the browser session.',
});

export const urlProperty = Property.ShortText({
    displayName: 'URL',
    required: false,
    description: 'URL to open in the new browser window.',
});

export const typeTextProperty = Property.ShortText({
    displayName: 'Text to Type',
    required: true,
    description: 'Text to type into the targeted element.',
});

export const pageQueryProperty = Property.ShortText({
    displayName: 'Query',
    required: true,
    description: 'Query or question about the page (for AI-based actions).',
});

export const extractionConfigProperty = Property.LongText({
    displayName: 'Extraction Config',
    required: false,
    description: 'Paging or extraction configuration (for advanced paginated extraction).',
});
