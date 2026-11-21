import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, dropdownErrorPlaceholder, fetchExtensionPropertyNames, getResourceOptionsForType, resourcePlaceholder } from '../common';

export const resetCustomAttributesAction = createAction({
    auth: azureAdAuth,
    name: 'reset_custom_attributes',
    classification: 'DESTRUCTIVE',
    displayName: 'Reset Custom Attributes',
    description: 'Clears directory extension attributes (extension_*) on a user or group by setting them to null.',
    audience: 'both',
    aiMetadata: {
        description:
            'Clears directory extension attribute values on one user or group by setting them to null. Pass specific extension property names (extension_<appId>_<name>), or leave them empty to clear every extension attribute registered for that object type that currently has a value (broader blast radius). Unknown names fail with the Graph error. Destructive to the attribute data but idempotent: re-running leaves the same empty state.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'success', label: 'Success', format: 'boolean' },
            { key: 'id', label: 'Resource ID' },
            { key: 'cleared', label: 'Cleared Attributes', description: 'Names that were set to null.' },
            { key: 'message', label: 'Message' },
        ],
    },
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
            description: 'Select the user or group, or type to search.',
            refreshers: ['resourceType'],
            refreshOnSearch: true,
            required: true,
            auth: azureAdAuth,
            options: async ({ auth, resourceType }, { searchValue }) => {
                if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
                if (typeof resourceType !== 'string' || resourceType === '') {
                    return { disabled: true, options: [], placeholder: 'Select resource type first.' };
                }
                try {
                    const { options, truncated } = await getResourceOptionsForType({ accessToken: auth.access_token, resourceType, search: searchValue });
                    return { disabled: false, options, placeholder: resourcePlaceholder({ count: options.length, truncated }) };
                } catch (error) {
                    return { disabled: true, options: [], placeholder: dropdownErrorPlaceholder({ what: 'items', error }) };
                }
            },
        }),
        extensionNames: Property.ShortText({
            displayName: 'Extension Property Names',
            description: 'Comma-separated extension property names to clear. Leave empty to clear every registered extension attribute that has a value.',
            required: false,
            placeholder: 'extension_1234abcd..._department',
            advanced: true,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const { resourceType, resourceId, extensionNames } = context.propsValue;
        if (resourceType !== 'users' && resourceType !== 'groups') {
            throw new Error('Resource Type must be "users" or "groups".');
        }
        const id = String(resourceId ?? '').trim();
        if (id === '') {
            throw new Error('Select the user or group whose attributes should be cleared.');
        }
        const url = `/${resourceType}/${encodeURIComponent(id)}`;
        const explicit = typeof extensionNames === 'string'
            ? Array.from(new Set(extensionNames.split(',').map((s) => s.trim()).filter(Boolean)))
            : [];
        let keysToClear: string[];
        if (explicit.length > 0) {
            await callGraphApi<Record<string, unknown>>(token, {
                method: HttpMethod.GET,
                url,
                query: { $select: ['id', ...explicit].join(',') },
            });
            keysToClear = explicit;
        } else {
            const names = await fetchExtensionPropertyNames({
                accessToken: token,
                targetObject: resourceType === 'users' ? 'User' : 'Group',
            });
            if (names.length === 0) {
                return { success: true, id, cleared: [], message: 'No extension attributes are registered for this object type.' };
            }
            const existing = await callGraphApi<Record<string, unknown>>(token, {
                method: HttpMethod.GET,
                url,
                query: { $select: ['id', ...names].join(',') },
            });
            keysToClear = names.filter((n) => existing[n] !== undefined && existing[n] !== null);
        }
        if (keysToClear.length === 0) {
            return { success: true, id, cleared: [], message: 'No extension attributes had a value; nothing was changed.' };
        }
        const patchBody: Record<string, null> = {};
        for (const key of keysToClear) {
            patchBody[key] = null;
        }
        await callGraphApi(token, {
            method: HttpMethod.PATCH,
            url,
            body: patchBody,
        });
        return { success: true, id, cleared: keysToClear, message: `Cleared ${keysToClear.length} extension attribute(s).` };
    },
});
