import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const advancedSwitchWithUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'advanced_switch_with_url',
    classification: 'READ',
    displayName: 'Advanced Switch with URL',
    description: 'Look up values by key in a JSON file hosted at a URL.',
    audience: 'both',
    aiMetadata: {
        description:
            'Load a JSON object of key-value pairs from a public URL and return the values stored under the given keys, like a lookup table or switch statement. Values are returned in the same order as the keys. Does not change anything; safe to retry, though results change if the hosted file changes.',
        idempotent: true,
    },
    props: {
        jsonUrl: Property.ShortText({
            displayName: 'JSON URL',
            description: 'A public link to a JSON file of key-value pairs.',
            required: true,
            placeholder: 'https://example.com/lookup.json',
        }),
        keys: Property.Array({
            displayName: 'Keys',
            description: 'The keys to look up in the JSON file.',
            required: true,
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.advancedSwitch,
    async run({ auth, propsValue }) {
        const keys = zeroCodeKitUrl.normalizeTextList(propsValue.keys);
        if (keys.length === 0) {
            throw new Error('Add at least one key to look up.');
        }
        const response = await zeroCodeKitApi.post<AdvancedSwitchResponse>({
            apiKey: auth.secret_text,
            path: '/operator/advancedswitch',
            body: {
                external: true,
                json: propsValue.jsonUrl.trim(),
                key: keys,
            },
        });
        const found = response.found;
        const values: unknown[] = Array.isArray(found) ? found : found === undefined || found === null ? [] : [found];
        return {
            found: values.length > 0,
            count: values.length,
            first_value: values[0] ?? null,
            values,
        };
    },
});

type AdvancedSwitchResponse = {
    found?: unknown;
};
