import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from './client';

function voiceDropdown<R extends boolean = true>({
    displayName,
    description,
    path,
    collectionKeys,
    placeholder,
    refreshers,
    valueFrom,
    required,
}: {
    displayName: string;
    description: string;
    path: string;
    collectionKeys: string[];
    placeholder: string;
    refreshers?: string[];
    valueFrom?: (record: Record<string, unknown>) => string | undefined;
    required?: R;
}) {
    return Property.Dropdown({
        displayName,
        description,
        required: (required ?? true) as R,
        auth: hkVoiceAuth,
        refreshers: refreshers ?? [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect HK Voice first',
                };
            }
            const connection = hkVoiceApi.connectionFromAuth(auth);
            const body = await hkVoiceApi.request({
                ...connection,
                method: HttpMethod.GET,
                path,
                query: { limit: 200, offset: 0 },
            });
            const items = hkVoiceApi.extractList({ body, collectionKeys });
            const resolveValue = valueFrom ?? hkVoiceApi.optionValue;
            return {
                disabled: false,
                placeholder,
                options: items.flatMap((item) => {
                    const value = resolveValue(item);
                    if (!value) {
                        return [];
                    }
                    return [{ label: hkVoiceApi.optionLabel(item), value }];
                }),
            };
        },
    });
}

export const hkVoiceProps = {
    agentId: voiceDropdown({
        displayName: 'Agent',
        description: 'Pick the Voice organization agent.',
        path: hkVoiceApi.paths.agents,
        collectionKeys: ['results', 'agents'],
        placeholder: 'Select an agent',
    }),
    optionalAgentId: voiceDropdown({
        displayName: 'Agent',
        description:
            'Optional. Defaults to the first active, verified agent in the organization.',
        path: hkVoiceApi.paths.agents,
        collectionKeys: ['results', 'agents'],
        placeholder: 'Select an agent (or leave empty)',
        required: false,
    }),
    marketplaceAgentId: voiceDropdown({
        displayName: 'Marketplace agent',
        description: 'Marketplace template to clone into this organization.',
        path: hkVoiceApi.paths.marketplace,
        collectionKeys: ['results', 'agents'],
        placeholder: 'Select a marketplace agent',
    }),
    callFlowId: voiceDropdown({
        displayName: 'Call flow',
        description: 'Pick the Voice call flow to run.',
        path: hkVoiceApi.paths.callFlows,
        collectionKeys: ['results', 'callflows'],
        placeholder: 'Select a call flow',
    }),
    optionalCallFlowId: voiceDropdown({
        displayName: 'Call flow',
        description:
            'Optional. When empty, the agent runs on its base prompt alone.',
        path: hkVoiceApi.paths.callFlows,
        collectionKeys: ['results', 'callflows'],
        placeholder: 'Select a call flow (or leave empty)',
        required: false,
    }),
    campaignId: voiceDropdown({
        displayName: 'Campaign',
        description: 'Pick a Voice campaign.',
        path: hkVoiceApi.paths.campaigns,
        collectionKeys: ['results', 'campaigns'],
        placeholder: 'Select a campaign',
    }),
    fromNumber: voiceDropdown({
        displayName: 'From number',
        description: 'Caller ID — one of the organization active numbers (E.164).',
        path: hkVoiceApi.paths.phoneNumbers,
        collectionKeys: ['results', 'phone_numbers'],
        placeholder: 'Select a phone number',
        valueFrom: hkVoiceApi.phoneNumberValue,
    }),
    optionalFromNumber: voiceDropdown({
        displayName: 'From number',
        description:
            'Caller ID from your Voice numbers. Defaults to the first active organization number.',
        path: hkVoiceApi.paths.phoneNumbers,
        collectionKeys: ['results', 'phone_numbers'],
        placeholder: 'Select a phone number (or leave empty)',
        valueFrom: hkVoiceApi.phoneNumberValue,
        required: false,
    }),
};

/** Coerce Object / JSON / mention-resolved maps into a flat string record for Voice. */
export function toStringRecord(
    value: unknown
): Record<string, string> | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    let record: unknown = value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return undefined;
        }
        try {
            record = JSON.parse(trimmed);
        } catch {
            throw new Error('Expected a JSON object of key/value pairs');
        }
    }
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
        throw new Error('Expected a JSON object of key/value pairs');
    }
    const result: Record<string, string> = {};
    for (const [key, entry] of Object.entries(record as Record<string, unknown>)) {
        if (entry === undefined || entry === null) {
            continue;
        }
        result[key] =
            typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean'
                ? String(entry)
                : JSON.stringify(entry);
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
