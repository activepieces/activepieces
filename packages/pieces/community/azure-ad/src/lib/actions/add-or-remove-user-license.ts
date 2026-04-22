import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser, userDropdown } from '../common';

export const addOrRemoveUserLicenseAction = createAction({
    auth: azureAdAuth,
    name: 'add_or_remove_user_license',
    displayName: 'Add or Remove User License',
    description: 'Assigns or removes licenses for a user. Use addLicenses to add (include disabledPlans to disable specific service plans) and removeLicenses to remove by SkuId.',
    props: {
        userId: userDropdown,
        addLicenses: Property.Json({
            displayName: 'Add Licenses',
            description: 'JSON array of license assignments. Example: [{"skuId":"sku-guid"}] or [{"skuId":"sku-guid","disabledPlans":["plan-guid-1"]}] to disable specific plans.',
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
        const token = context.auth.access_token;
        const { userId, addLicenses, removeLicenses } = context.propsValue;
        const add = Array.isArray(addLicenses) ? addLicenses : [];
        const remove = Array.isArray(removeLicenses) ? removeLicenses : [];
        if (add.length === 0 && remove.length === 0) {
            throw new Error('Provide at least one entry in Add Licenses or Remove Licenses.');
        }
        const body = {
            addLicenses: add.map((a: { skuId: string; disabledPlans?: string[] }) => ({
                skuId: a.skuId,
                ...(Array.isArray(a.disabledPlans) && a.disabledPlans.length > 0 && { disabledPlans: a.disabledPlans }),
            })),
            removeLicenses: remove,
        };
        // https://learn.microsoft.com/en-us/graph/api/user-assignlicense?view=graph-rest-1.0&tabs=http
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}/assignLicense`,
            body,
        });
        return flattenUser(user);
    },
});
