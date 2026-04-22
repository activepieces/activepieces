import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, getResourceOptionsForType } from '../common';

export const resetCustomAttributesAction = createAction({
    auth: azureAdAuth,
    name: 'reset_custom_attributes',
    displayName: 'Reset Custom Attributes',
    description: 'Clears extension/custom attributes on a user or group. Provide the resource type and ID, and the extension property names to clear.',
    props: {
        resourceType: Property.StaticDropdown({
            displayName: 'Resource Type',
            description: 'User or Group',
            required: true,
            options: {
                disabled: false,
                options: [
                    { label: 'User', value: 'users' },
                    { label: 'Group', value: 'groups' },
                ],
            },
        }),
        resourceId: Property.Dropdown({
            displayName: 'Resource',
            description: 'Select the user or group to clear extension attributes from.',
            refreshers: ['resourceType'],
            required: true,
            auth: azureAdAuth,
            options: async ({ auth, resourceType }) => {
                if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
                const type = resourceType as string;
                if (!type) return { disabled: true, options: [], placeholder: 'Select resource type first.' };
                try {
                    const token = auth.access_token;
                    const options = await getResourceOptionsForType(token, type);
                    return {
                        disabled: false,
                        options,
                        placeholder: options.length === 0 ? 'No items found.' : undefined,
                    };
                } catch {
                    return { disabled: true, options: [], placeholder: 'Failed to load. Check your connection.' };
                }
            },
        }),
        extensionNames: Property.ShortText({
            displayName: 'Extension Property Names',
            description: 'Comma-separated extension property names to clear (e.g. extension_xxx_AttributeName). Leave empty to clear known extension keys.',
            required: false,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const { resourceType, resourceId, extensionNames } = context.propsValue;
        const resource = resourceType as string;
        const id = resourceId as string;
        const getUrl = `https://graph.microsoft.com/v1.0/${resource}/${encodeURIComponent(id)}`;
        // https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http
        // https://learn.microsoft.com/en-us/graph/api/group-get?view=graph-rest-1.0&tabs=http
        const existing = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: getUrl,
        });
        const keysToClear = extensionNames
            ? (extensionNames as string).split(',').map((s) => s.trim()).filter(Boolean)
            : Object.keys(existing).filter((k) => k.startsWith('extension_') || k.startsWith('ext_'));
        const patchBody: Record<string, null> = {};
        for (const key of keysToClear) {
            if (existing[key] !== undefined) patchBody[key] = null;
        }
        if (Object.keys(patchBody).length === 0) {
            return { success: true, message: 'No extension attributes to reset.' };
        }
        // https://learn.microsoft.com/en-us/graph/api/user-update?view=graph-rest-1.0&tabs=http
        // https://learn.microsoft.com/en-us/graph/api/group-update?view=graph-rest-1.0&tabs=http
        await callGraphApi(token, {
            method: HttpMethod.PATCH,
            url: getUrl,
            body: patchBody,
        });
        return { success: true, cleared: keysToClear };
    },
});
