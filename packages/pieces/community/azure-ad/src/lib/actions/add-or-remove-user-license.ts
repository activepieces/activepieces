import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, dropdownErrorPlaceholder, flattenedUserFields, flattenUser, GraphApiError, userDropdown } from '../common';

export const addOrRemoveUserLicenseAction = createAction({
    auth: azureAdAuth,
    name: 'add_or_remove_user_license',
    classification: 'DESTRUCTIVE',
    displayName: 'Add or Remove User License',
    description: 'Give a user licenses or take them away, such as Microsoft 365 E3. Pick licenses by name.',
    audience: 'both',
    aiMetadata: {
        description:
            'Assigns and/or removes license SKUs for an existing Microsoft Entra ID user in one call. licensesToAdd and licensesToRemove take skuId values (from List Subscribed Licenses). addLicenses (JSON, [{"skuId","disabledPlans"}]) and removeLicenses (JSON array of skuIds) are still accepted and merged with them; addLicenses wins when the same skuId appears in both add inputs. The same skuId cannot be added and removed at once. The user needs a usageLocation before licenses can be assigned. Idempotent: adding a license the user already holds, or removing one they do not hold, succeeds without change. A brief directory concurrency conflict (common right after Create User) is retried automatically.',
        idempotent: true,
    },
    outputSchema: { fields: flattenedUserFields },
    props: {
        userId: userDropdown,
        licensesToAdd: skuMultiSelect({ displayName: 'Licenses to Add', description: 'Licenses to give the user. The user needs a usage location.' }),
        licensesToRemove: skuMultiSelect({ displayName: 'Licenses to Remove', description: 'Licenses to take away from the user.' }),
        addLicenses: Property.Json({
            displayName: 'Add Licenses (JSON)',
            description: 'Advanced: disabledPlans etc. Example: [{"skuId":"…","disabledPlans":["…"]}]',
            required: false,
            defaultValue: [],
            advanced: true,
        }),
        removeLicenses: Property.Json({
            displayName: 'Remove Licenses (JSON)',
            description: 'Advanced: SKU IDs to remove. Example: ["…"]',
            required: false,
            defaultValue: [],
            advanced: true,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const { userId, addLicenses, removeLicenses, licensesToAdd, licensesToRemove } = context.propsValue;
        const body = buildAssignLicenseBody({ addLicenses, removeLicenses, licensesToAdd, licensesToRemove });
        const url = `/users/${encodeURIComponent(String(userId))}/assignLicense`;
        for (let attempt = 1; ; attempt++) {
            try {
                const user = await callGraphApi<Record<string, unknown>>(token, { method: HttpMethod.POST, url, body });
                return flattenUser(user);
            } catch (error) {
                if (attempt > CONCURRENCY_RETRY_DELAYS_MS.length || !isConcurrencyViolation(error)) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, CONCURRENCY_RETRY_DELAYS_MS[attempt - 1]));
            }
        }
    },
});

export function buildAssignLicenseBody({
    addLicenses,
    removeLicenses,
    licensesToAdd,
    licensesToRemove,
}: {
    addLicenses: unknown;
    removeLicenses: unknown;
    licensesToAdd: unknown;
    licensesToRemove: unknown;
}): { addLicenses: LicenseAssignment[]; removeLicenses: string[] } {
    const jsonAdd = (Array.isArray(addLicenses) ? addLicenses : []).map((entry, i) => toAssignment({ entry, index: i }));
    const pickedAdd = stringList(licensesToAdd).filter((skuId) => !jsonAdd.some((a) => a.skuId === skuId)).map((skuId) => ({ skuId }));
    const add = [...jsonAdd, ...pickedAdd];
    const remove = Array.from(new Set([...stringList(removeLicenses), ...stringList(licensesToRemove)]));
    if (add.length === 0 && remove.length === 0) {
        throw new Error('Pick at least one license to add or remove.');
    }
    const both = add.filter((a) => remove.includes(a.skuId)).map((a) => a.skuId);
    if (both.length > 0) {
        throw new Error(`A license cannot be added and removed in the same step: ${both.join(', ')}.`);
    }
    return { addLicenses: add, removeLicenses: remove };
}

function toAssignment({ entry, index }: { entry: unknown; index: number }): LicenseAssignment {
    if (typeof entry !== 'object' || entry === null || !('skuId' in entry) || typeof entry.skuId !== 'string' || entry.skuId.trim() === '') {
        throw new Error(`Add Licenses (JSON) entry ${index + 1} needs a "skuId" string.`);
    }
    const plans = 'disabledPlans' in entry && Array.isArray(entry.disabledPlans)
        ? entry.disabledPlans.filter((p: unknown): p is string => typeof p === 'string')
        : [];
    return plans.length > 0 ? { skuId: entry.skuId.trim(), disabledPlans: plans } : { skuId: entry.skuId.trim() };
}

function stringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter((v) => v !== '');
}

function skuMultiSelect({ displayName, description }: { displayName: string; description: string }) {
    return Property.MultiSelectDropdown({
        displayName,
        description,
        refreshers: [],
        required: false,
        auth: azureAdAuth,
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
            try {
                const res = await callGraphApi<{ value?: SkuOption[] }>(auth.access_token, { method: HttpMethod.GET, url: '/subscribedSkus' });
                const options = (res.value ?? [])
                    .filter((sku): sku is SkuOption & { skuId: string } => typeof sku.skuId === 'string')
                    .map((sku) => ({ label: skuLabel(sku), value: sku.skuId }));
                return { disabled: false, options, placeholder: options.length === 0 ? 'No licenses in this tenant.' : undefined };
            } catch (error) {
                return { disabled: true, options: [], placeholder: dropdownErrorPlaceholder({ what: 'licenses', error }) };
            }
        },
    });
}

export function skuLabel(sku: SkuOption): string {
    const part = sku.skuPartNumber ?? sku.skuId ?? 'Unknown license';
    const friendly = SKU_FRIENDLY_NAMES[part];
    const available = Math.max(0, (sku.prepaidUnits?.enabled ?? 0) - (sku.consumedUnits ?? 0));
    return `${friendly ?? part} · ${available} available`;
}

function isConcurrencyViolation(error: unknown): boolean {
    return error instanceof GraphApiError && error.graphStatus === 409 && error.graphCode === 'Directory_ConcurrencyViolation';
}

const CONCURRENCY_RETRY_DELAYS_MS = [1000, 3000];

const SKU_FRIENDLY_NAMES: Record<string, string> = {
    STANDARDPACK: 'Office 365 E1',
    DYN365_SALES_PREMIUM: 'Dynamics 365 Sales Premium',
    DYN365_ENTERPRISE_SALES: 'Dynamics 365 Sales Enterprise',
    DYN365_BUSCENTRAL_ESSENTIAL: 'Dynamics 365 Business Central Essentials',
    ENTERPRISEPACK: 'Office 365 E3',
    ENTERPRISEPREMIUM: 'Office 365 E5',
    SPE_E3: 'Microsoft 365 E3',
    SPE_E5: 'Microsoft 365 E5',
    SPB: 'Microsoft 365 Business Premium',
    O365_BUSINESS_PREMIUM: 'Microsoft 365 Business Standard',
    O365_BUSINESS_ESSENTIALS: 'Microsoft 365 Business Basic',
    EMS: 'Enterprise Mobility + Security E3',
    AAD_PREMIUM: 'Microsoft Entra ID P1',
    AAD_PREMIUM_P2: 'Microsoft Entra ID P2',
    POWER_BI_PRO: 'Power BI Pro',
    POWER_BI_STANDARD: 'Power BI (free)',
    FLOW_FREE: 'Power Automate Free',
};

type LicenseAssignment = { skuId: string; disabledPlans?: string[] };

export type SkuOption = { skuId?: string; skuPartNumber?: string; consumedUnits?: number; prepaidUnits?: { enabled?: number } };
