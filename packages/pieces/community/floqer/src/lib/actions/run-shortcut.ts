import { HttpMethod } from '@activepieces/pieces-common';
import {
    createAction,
    InputProperty,
    InputPropertyMap,
    Property,
} from '@activepieces/pieces-framework';
import { floqerAuth } from '../auth';
import { floqerApi } from '../common/client';
import { floqerProps } from '../common/props';
import { FloqerInputField, FloqerShortcut } from '../common/types';

export const runShortcutAction = createAction({
    auth: floqerAuth,
    name: 'run_shortcut',
    displayName: 'Run Shortcut',
    description: 'Run a published Floqer shortcut and return its result.',
    props: {
        shortcutId: floqerProps.shortcutId(),
        inputData: Property.DynamicProperties({
            auth: floqerAuth,
            displayName: 'Inputs',
            description: 'The inputs this shortcut expects.',
            required: true,
            refreshers: ['shortcutId'],
            props: async ({ auth, shortcutId }) => {
                if (!auth || !shortcutId) {
                    return {};
                }
                const shortcut = await findShortcut({
                    apiKey: auth.secret_text,
                    shortcutId: String(shortcutId),
                });
                if (shortcut === undefined) {
                    return {};
                }
                return buildInputProps(shortcut.input_schema ?? []);
            },
        }),
    },
    async run({ auth, propsValue }) {
        const inputData = stripEmpty(propsValue.inputData);

        const response = await floqerApi.enveloped<unknown>({
            apiKey: auth.secret_text,
            method: HttpMethod.POST,
            path: `/api/v1/shortcuts/${propsValue.shortcutId}/run`,
            body: { input_data: inputData },
        });

        return response.data;
    },
});

async function findShortcut({
    apiKey,
    shortcutId,
}: {
    apiKey: string;
    shortcutId: string;
}): Promise<FloqerShortcut | undefined> {
    const response = await floqerApi.enveloped<FloqerShortcut[]>({
        apiKey,
        method: HttpMethod.GET,
        path: '/api/v1/shortcuts/',
        queryParams: { filter: 'all' },
    });
    return response.data.find((shortcut) => shortcut.id === shortcutId);
}

function buildInputProps(fields: FloqerInputField[]): InputPropertyMap {
    return Object.fromEntries(
        fields.map((field) => [field.reference, buildInputProp(field)]),
    );
}

function buildInputProp(field: FloqerInputField): InputProperty {
    const shared = {
        displayName: field.name || field.reference,
        description: field.description,
        required: field.required ?? false,
        defaultValue: field.defaultValue,
    };

    switch ((field.type ?? '').toLowerCase()) {
        case 'number':
        case 'integer':
        case 'float':
            return Property.Number({
                ...shared,
                defaultValue: typeof field.defaultValue === 'number' ? field.defaultValue : undefined,
            });
        case 'boolean':
        case 'checkbox':
            return Property.Checkbox({
                ...shared,
                defaultValue:
                    typeof field.defaultValue === 'boolean' ? field.defaultValue : undefined,
            });
        case 'textarea':
        case 'long_text':
            return Property.LongText({
                ...shared,
                defaultValue: typeof field.defaultValue === 'string' ? field.defaultValue : undefined,
            });
        default:
            return Property.ShortText({
                ...shared,
                defaultValue: typeof field.defaultValue === 'string' ? field.defaultValue : undefined,
            });
    }
}

function stripEmpty(inputData: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(inputData).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
        ),
    );
}
