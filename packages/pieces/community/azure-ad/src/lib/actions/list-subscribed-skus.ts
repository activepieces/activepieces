import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

export const listSubscribedSkusAction = createAction({
    auth: azureAdAuth,
    name: 'list_subscribed_skus',
    classification: 'SEARCH',
    displayName: 'List Subscribed Licenses',
    description: 'Lists the license SKUs your organization subscribes to, with how many seats are used and free.',
    audience: 'both',
    aiMetadata: {
        description:
            'Lists the Microsoft license SKUs the tenant subscribes to. Each item has skuId (pass it to Add or Remove User License), skuPartNumber (readable name such as ENTERPRISEPACK), capabilityStatus, enabledUnits, consumedUnits and availableUnits (enabled minus consumed; assigning fails when it is 0), and servicePlans (servicePlanId values usable as disabledPlans). Read-only and idempotent.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            {
                key: 'items',
                label: 'Licenses',
                labelKey: 'skuPartNumber',
                listItems: [
                    { key: 'skuId', label: 'SKU ID' },
                    { key: 'skuPartNumber', label: 'SKU Part Number' },
                    { key: 'capabilityStatus', label: 'Status' },
                    { key: 'enabledUnits', label: 'Enabled Units', format: 'number' },
                    { key: 'consumedUnits', label: 'Consumed Units', format: 'number' },
                    { key: 'availableUnits', label: 'Available Units', format: 'number' },
                    {
                        key: 'servicePlans',
                        label: 'Service Plans',
                        labelKey: 'servicePlanName',
                        listItems: [
                            { key: 'servicePlanId', label: 'Service Plan ID' },
                            { key: 'servicePlanName', label: 'Service Plan Name' },
                            { key: 'provisioningStatus', label: 'Provisioning Status' },
                            { key: 'appliesTo', label: 'Applies To' },
                        ],
                    },
                ],
            },
        ],
    },
    props: {},
    async run(context) {
        const res = await callGraphApi<{ value?: GraphSku[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: '/subscribedSkus',
        });
        return {
            items: (res.value ?? []).map((sku) => {
                const enabledUnits = sku.prepaidUnits?.enabled ?? 0;
                const consumedUnits = sku.consumedUnits ?? 0;
                return {
                    skuId: sku.skuId ?? null,
                    skuPartNumber: sku.skuPartNumber ?? null,
                    capabilityStatus: sku.capabilityStatus ?? null,
                    enabledUnits,
                    consumedUnits,
                    availableUnits: Math.max(0, enabledUnits - consumedUnits),
                    servicePlans: (sku.servicePlans ?? []).map((p) => ({
                        servicePlanId: p.servicePlanId ?? null,
                        servicePlanName: p.servicePlanName ?? null,
                        provisioningStatus: p.provisioningStatus ?? null,
                        appliesTo: p.appliesTo ?? null,
                    })),
                };
            }),
        };
    },
});

type GraphSku = {
    skuId?: string;
    skuPartNumber?: string;
    capabilityStatus?: string;
    consumedUnits?: number;
    prepaidUnits?: { enabled?: number };
    servicePlans?: { servicePlanId?: string; servicePlanName?: string; provisioningStatus?: string; appliesTo?: string }[];
};
