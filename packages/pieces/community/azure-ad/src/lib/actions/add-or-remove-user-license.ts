import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser } from '../common';

export const addOrRemoveUserLicenseAction = createAction({
    auth: azureAdAuth,
    name: 'add_or_remove_user_license',
    displayName: 'Add or Remove User License',
    description: 'Assigns or removes licenses for a user. Use addLicenses to add and removeLicenses to remove (by SkuId).',
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'The object ID or user principal name (e.g. user@domain.com) of the user.',
            required: true,
        }),
        addLicenses: Property.Json({
            displayName: 'Add Licenses',
            description: 'JSON array of license assignments to add. Example: [{"skuId":"sku-guid"}]',
            required: false,
            defaultValue: [],
        }),
        removeLicenses: Property.Json({
            displayName: 'Remove Licenses',
            description: 'JSON array of SKU IDs (strings) to remove. Example: ["sku-guid-1","sku-guid-2"]',
            required: false,
            defaultValue: [],
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { userId, addLicenses, removeLicenses } = context.propsValue;
        const add = Array.isArray(addLicenses) ? addLicenses : [];
        const remove = Array.isArray(removeLicenses) ? removeLicenses : [];
        const body = {
            addLicenses: add.map((a: { skuId: string }) => ({ skuId: a.skuId })),
            removeLicenses: remove,
        };
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/assignLicense`,
            body,
        });
        return flattenUser(user);
    },
});
