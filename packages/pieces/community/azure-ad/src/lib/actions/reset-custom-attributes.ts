import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

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
        resourceId: Property.ShortText({
            displayName: 'Resource ID',
            description: 'The object ID of the user or group.',
            required: true,
        }),
        extensionNames: Property.ShortText({
            displayName: 'Extension Property Names',
            description: 'Comma-separated extension property names to clear (e.g. extension_xxx_AttributeName). Leave empty to clear known extension keys.',
            required: false,
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { resourceType, resourceId, extensionNames } = context.propsValue;
        const resource = resourceType as string;
        const id = resourceId as string;
        const getUrl = `https://graph.microsoft.com/v1.0/${resource}/${encodeURIComponent(id)}`;
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
        await callGraphApi(token, {
            method: HttpMethod.PATCH,
            url: getUrl,
            body: patchBody,
        });
        return { success: true, cleared: keysToClear };
    },
});
