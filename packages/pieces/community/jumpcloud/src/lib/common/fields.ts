import { DynamicPropsValue, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from './client';
import { jumpcloudObjects } from './objects';
import { ApiRecord, ObjectTypeKey } from './types';

export const jumpcloudFields = {
    fieldsProp,
    additionalFieldsProp,
    buildChanges,
    mergeForReplace,
};

function fieldsProp({ mode }: { mode: FieldMode }) {
    return Property.DynamicProperties({
        auth: jumpcloudAuth,
        displayName: mode === 'create' ? 'Fields' : 'Fields to Change',
        description: mode === 'create' ? undefined : 'Only filled-in fields are changed. Empty fields keep their current value.',
        required: true,
        refreshers: ['objectType'],
        props: async ({ objectType }) => {
            if (!jumpcloudObjects.isObjectType(objectType)) {
                return {};
            }
            return FIELD_SPECS[objectType].reduce<InputPropertyMap>(
                (props, spec) => ({
                    ...props,
                    [spec.key]: Property.ShortText({
                        displayName: spec.label,
                        description: spec.description,
                        required: mode === 'create' && spec.requiredOnCreate === true,
                        ...(mode === 'create' && spec.createDefault !== undefined ? { defaultValue: spec.createDefault } : {}),
                    }),
                }),
                {},
            );
        },
    });
}

function additionalFieldsProp() {
    return Property.Json({
        displayName: 'Additional Fields',
        description:
            'Any other JumpCloud fields for this object, as a JSON object, for example {"phoneNumbers": [{"type": "work", "number": "+1 555 0100"}]}. Fields above take precedence. See the JumpCloud API reference for the field names.',
        required: false,
        advanced: true,
    });
}

function buildChanges({ type, fields, additionalFields }: BuildParams): ApiRecord {
    const extra = parseAdditionalFields(additionalFields);
    const typed = FIELD_SPECS[type].reduce<ApiRecord>((body, spec) => {
        const value = fields?.[spec.key];
        return typeof value === 'string' && value.trim().length > 0 ? { ...body, [spec.key]: value.trim() } : body;
    }, {});
    return { ...extra, ...typed };
}

function mergeForReplace({ type, current, changes }: { type: ObjectTypeKey; current: ApiRecord; changes: ApiRecord }): ApiRecord {
    const kept = Object.fromEntries(Object.entries(current).filter(([key]) => !READ_ONLY_KEYS[type].includes(key)));
    return { ...kept, ...changes };
}

function parseAdditionalFields(value: unknown): ApiRecord {
    if (value === undefined || value === null || value === '') {
        return {};
    }
    const parsed = typeof value === 'string' ? parseJsonObject(value) : value;
    if (!jumpcloudApi.isRecord(parsed)) {
        throw new Error('Additional Fields must be a JSON object, such as {"location": "Remote"}.');
    }
    return parsed;
}

function parseJsonObject(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        throw new Error('Additional Fields is not valid JSON. Use a JSON object, such as {"location": "Remote"}.');
    }
}

const USER_FIELDS: FieldSpec[] = [
    { key: 'username', label: 'Username', requiredOnCreate: true, description: 'Unique login name, for example jane.doe.' },
    { key: 'email', label: 'Email', requiredOnCreate: true, description: 'Unique email address. JumpCloud sends the activation email here.' },
    { key: 'firstname', label: 'First Name' },
    { key: 'lastname', label: 'Last Name' },
    { key: 'displayname', label: 'Display Name' },
    { key: 'employeeIdentifier', label: 'Employee ID', description: 'Must be unique across the organization.' },
    { key: 'employeeType', label: 'Employee Type', description: 'For example Full-time or Contractor.' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'company', label: 'Company' },
    { key: 'costCenter', label: 'Cost Center' },
    { key: 'location', label: 'Location' },
    { key: 'description', label: 'Description' },
];

const GROUP_FIELDS: FieldSpec[] = [
    { key: 'name', label: 'Name', requiredOnCreate: true, description: 'Group names must be unique.' },
    { key: 'description', label: 'Description' },
    { key: 'email', label: 'Email', description: 'Optional email address for the group.' },
];

const FIELD_SPECS: Record<ObjectTypeKey, FieldSpec[]> = {
    user: USER_FIELDS,
    system: [{ key: 'displayName', label: 'Display Name', description: 'The name shown for this device in JumpCloud.' }],
    user_group: GROUP_FIELDS,
    system_group: GROUP_FIELDS,
    application: [
        { key: 'displayLabel', label: 'Display Label', requiredOnCreate: true, description: 'The name users see in the JumpCloud User Portal.' },
        { key: 'ssoUrl', label: 'URL', requiredOnCreate: true, description: 'The address the application opens, for example https://app.example.com.' },
        {
            key: 'name',
            label: 'Application Template',
            createDefault: 'bookmark',
            description: 'The JumpCloud catalog template name. Keep "bookmark" for a simple link; SAML apps also need their config in Additional Fields.',
        },
        { key: 'description', label: 'Description' },
    ],
};

const READ_ONLY_KEYS: Record<ObjectTypeKey, string[]> = {
    user: ['_id', 'created'],
    system: ['_id', 'created'],
    user_group: ['id', 'type', 'memberQueryErrorFlags', 'suggestionCounts', 'organizationObjectId'],
    system_group: ['id', 'type', 'memberQueryErrorFlags', 'organizationObjectId'],
    application: ['_id', 'id', 'created', 'organization'],
};

type FieldMode = 'create' | 'update';

type FieldSpec = {
    key: string;
    label: string;
    description?: string;
    requiredOnCreate?: boolean;
    createDefault?: string;
};

type BuildParams = {
    type: ObjectTypeKey;
    fields: DynamicPropsValue | undefined;
    additionalFields: unknown;
};
