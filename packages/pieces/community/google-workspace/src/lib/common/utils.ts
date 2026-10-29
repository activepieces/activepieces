import type {
  GoogleWorkspaceRecordField,
  GoogleWorkspaceResourceDefinition,
  GoogleWorkspaceResourceType,
  GoogleWorkspaceVerb,
} from './types';

function resourceDefinition(type: string): GoogleWorkspaceResourceDefinition {
  if (!isResourceType(type)) {
    throw new Error(
      `Unknown resource type "${type}". Expected one of: ${Object.keys(RESOURCES).join(', ')}.`,
    );
  }
  return RESOURCES[type];
}

function assertVerb({
  def,
  verb,
}: {
  def: GoogleWorkspaceResourceDefinition;
  verb: GoogleWorkspaceVerb;
}): void {
  if (!def.verbs.includes(verb)) {
    throw new Error(
      `${
        def.label
      } records do not support "${verb}" through the Directory API (allowed: ${def.verbs.join(
        ', ',
      )}).`,
    );
  }
}

function idOf({
  def,
  item,
}: {
  def: GoogleWorkspaceResourceDefinition;
  item: Record<string, unknown>;
}): string | null {
  const value = item[def.idField];
  return value === undefined || value === null ? null : String(value);
}

function isRootOrgUnitPath(id: string): boolean {
  return String(id ?? '').trim() === '/';
}

function parseRecord(value: unknown): Record<string, unknown> {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  if (!isPlainObject(parsed)) {
    throw new Error('The record must be a JSON object.');
  }
  return parsed;
}

function stringValues(value: Record<string, unknown> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );
}

function assertCustomApiCallUrl(url: unknown): void {
  if (typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return;
  }
  const allowed = new URL(GOOGLE_ADMIN_API_ROOT).origin;
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new Error(
      `The URL "${url}" is not valid. Use a path relative to ${GOOGLE_ADMIN_API_ROOT}, e.g. /${DIRECTORY_PATH}/users.`,
    );
  }
  if (origin !== allowed) {
    throw new Error(
      `Custom API Call only sends the Google Workspace credentials to ${allowed}, not to ${origin}. Use a path relative to ${GOOGLE_ADMIN_API_ROOT} (e.g. /${DIRECTORY_PATH}/users) or a full URL on that host.`,
    );
  }
}

function buildRecordBody({
  def,
  values,
}: {
  def: GoogleWorkspaceResourceDefinition;
  values: Record<string, unknown> | undefined;
}): Record<string, unknown> {
  const entries = Object.entries(values ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );
  return entries.reduce<Record<string, unknown>>((body, [key, value]) => {
    const field = (def.fields ?? []).find((f) => f.key === key);
    if (field) {
      return setPath({ target: body, path: field.path, value });
    }
    const custom = parseCustomFieldKey(key);
    if (custom) {
      const customValue = Array.isArray(value) ? value.map((v) => ({ value: v })) : value;
      return setPath({
        target: body,
        path: ['customSchemas', custom.schemaName, custom.fieldName],
        value: customValue,
      });
    }
    return body;
  }, {});
}

function recordBody({
  def,
  fields,
  extra,
}: {
  def: GoogleWorkspaceResourceDefinition;
  fields: Record<string, unknown> | undefined;
  extra: unknown;
}): Record<string, unknown> {
  const extraFields =
    extra === undefined || extra === null || extra === '' ? {} : parseRecord(extra);
  return { ...extraFields, ...buildRecordBody({ def, values: fields }) };
}

function customFieldKey({
  schemaName,
  fieldName,
}: {
  schemaName: string;
  fieldName: string;
}): string {
  return `${CUSTOM_FIELD_PREFIX}${schemaName.length}_${schemaName}_${fieldName}`;
}

function parseCustomFieldKey(key: string): { schemaName: string; fieldName: string } | null {
  const match = /^custom_(\d+)_(.*)$/.exec(key);
  if (!match?.[1] || match[2] === undefined) {
    return null;
  }
  const length = Number(match[1]);
  const rest = match[2];
  if (rest.length < length + 2 || rest[length] !== '_') {
    return null;
  }
  return { schemaName: rest.slice(0, length), fieldName: rest.slice(length + 1) };
}

function setPath({
  target,
  path,
  value,
}: {
  target: Record<string, unknown>;
  path: string[];
  value: unknown;
}): Record<string, unknown> {
  const [head, ...rest] = path;
  if (head === undefined) {
    return target;
  }
  if (rest.length === 0) {
    return { ...target, [head]: value };
  }
  const child = target[head];
  return {
    ...target,
    [head]: setPath({ target: isPlainObject(child) ? child : {}, path: rest, value }),
  };
}

function isResourceType(value: string): value is GoogleWorkspaceResourceType {
  return Object.prototype.hasOwnProperty.call(RESOURCES, value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function customer(segment: string): string {
  return `${DIRECTORY_PATH}/customer/${MY_CUSTOMER}/${segment}`;
}

function enc(value: string): string {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') {
    throw new Error(
      'The record identifier is empty. Fill it in (or check the step it comes from produced a value).',
    );
  }
  return encodeURIComponent(trimmed);
}

function encOrgUnit(path: string): string {
  return enc(
    String(path ?? '')
      .trim()
      .replace(/^\//, ''),
  );
}

function requireParent({
  parent,
  type,
}: {
  parent: string | undefined;
  type: GoogleWorkspaceResourceType;
}): string {
  const value = String(parent ?? '').trim();
  if (!value) {
    throw new Error(
      `"${RESOURCES[type].label}" needs the parent record: fill in the ${RESOURCES[type].parentLabel}.`,
    );
  }
  return value;
}

const GOOGLE_ADMIN_API_ROOT = 'https://admin.googleapis.com';
const DIRECTORY_PATH = 'admin/directory/v1';
const REPORTS_PATH = 'admin/reports/v1';
const DATA_TRANSFER_PATH = 'admin/datatransfer/v1';
const MY_CUSTOMER = 'my_customer';

const CUSTOM_FIELD_PREFIX = 'custom_';

const USER_FIELDS: GoogleWorkspaceRecordField[] = [
  {
    key: 'primaryEmail',
    path: ['primaryEmail'],
    displayName: 'Primary Email',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'givenName',
    path: ['name', 'givenName'],
    displayName: 'First Name',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'familyName',
    path: ['name', 'familyName'],
    displayName: 'Last Name',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'password',
    path: ['password'],
    displayName: 'Password',
    description: 'At least 8 characters. Never returned by Google.',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'changePasswordAtNextLogin',
    path: ['changePasswordAtNextLogin'],
    displayName: 'Change Password at Next Login',
    kind: 'checkbox',
  },
  {
    key: 'orgUnitPath',
    path: ['orgUnitPath'],
    displayName: 'Organizational Unit Path',
    description: 'e.g. `/` or `/Sales/West`.',
    kind: 'text',
  },
  { key: 'recoveryEmail', path: ['recoveryEmail'], displayName: 'Recovery Email', kind: 'text' },
  {
    key: 'recoveryPhone',
    path: ['recoveryPhone'],
    displayName: 'Recovery Phone',
    description: 'E.164 format, e.g. `+15551234567`.',
    kind: 'text',
  },
];

const GROUP_FIELDS: GoogleWorkspaceRecordField[] = [
  {
    key: 'email',
    path: ['email'],
    displayName: 'Group Email',
    kind: 'text',
    requiredOnCreate: true,
  },
  { key: 'name', path: ['name'], displayName: 'Name', kind: 'text' },
  { key: 'description', path: ['description'], displayName: 'Description', kind: 'text' },
];

const GROUP_MEMBER_FIELDS: GoogleWorkspaceRecordField[] = [
  {
    key: 'email',
    path: ['email'],
    displayName: 'Member Email',
    description: 'E-mail of the user or group to add.',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'role',
    path: ['role'],
    displayName: 'Role',
    kind: 'dropdown',
    options: ['MEMBER', 'MANAGER', 'OWNER'],
  },
];

const ORG_UNIT_FIELDS: GoogleWorkspaceRecordField[] = [
  { key: 'name', path: ['name'], displayName: 'Name', kind: 'text', requiredOnCreate: true },
  {
    key: 'parentOrgUnitPath',
    path: ['parentOrgUnitPath'],
    displayName: 'Parent Path',
    description: 'e.g. `/` for the top level or `/Sales`.',
    kind: 'text',
    requiredOnCreate: true,
  },
  { key: 'description', path: ['description'], displayName: 'Description', kind: 'text' },
];

const CHROMEOS_DEVICE_FIELDS: GoogleWorkspaceRecordField[] = [
  { key: 'annotatedUser', path: ['annotatedUser'], displayName: 'Annotated User', kind: 'text' },
  {
    key: 'annotatedLocation',
    path: ['annotatedLocation'],
    displayName: 'Annotated Location',
    kind: 'text',
  },
  { key: 'annotatedAssetId', path: ['annotatedAssetId'], displayName: 'Asset ID', kind: 'text' },
  { key: 'notes', path: ['notes'], displayName: 'Notes', kind: 'text' },
  {
    key: 'orgUnitPath',
    path: ['orgUnitPath'],
    displayName: 'Organizational Unit Path',
    kind: 'text',
  },
];

const ROLE_ASSIGNMENT_FIELDS: GoogleWorkspaceRecordField[] = [
  {
    key: 'roleId',
    path: ['roleId'],
    displayName: 'Role ID',
    description:
      'Find it with Custom API Call: GET /admin/directory/v1/customer/my_customer/roles.',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'assignedTo',
    path: ['assignedTo'],
    displayName: 'Assigned To (User ID)',
    description: 'The numeric id of the user, from Get Record.',
    kind: 'text',
    requiredOnCreate: true,
  },
  {
    key: 'scopeType',
    path: ['scopeType'],
    displayName: 'Scope',
    kind: 'dropdown',
    options: ['CUSTOMER', 'ORG_UNIT'],
    requiredOnCreate: true,
  },
  {
    key: 'orgUnitId',
    path: ['orgUnitId'],
    displayName: 'Org Unit ID',
    description: 'Only with scope ORG_UNIT.',
    kind: 'text',
  },
];

const RESOURCES: Record<GoogleWorkspaceResourceType, GoogleWorkspaceResourceDefinition> = {
  user: {
    type: 'user',
    label: 'User',
    collectionPath: () => `${DIRECTORY_PATH}/users`,
    itemPath: ({ id }) => `${DIRECTORY_PATH}/users/${enc(id)}`,
    itemsKey: 'users',
    idField: 'id',
    idHint: 'primary e-mail, alias or user id',
    verbs: ['get', 'list', 'create', 'update', 'delete'],
    supportsQuery: true,
    supportsDomain: true,
    maxPageSize: 500,
    createExample: {
      primaryEmail: 'jane.doe@example.com',
      name: { givenName: 'Jane', familyName: 'Doe' },
      password: 'a-temporary-password',
      changePasswordAtNextLogin: true,
      orgUnitPath: '/',
    },
    extraListParams: [
      'orderBy',
      'sortOrder',
      'projection',
      'customFieldMask',
      'showDeleted',
      'viewType',
    ],
    fields: USER_FIELDS,
  },
  group: {
    type: 'group',
    label: 'Group',
    collectionPath: () => `${DIRECTORY_PATH}/groups`,
    itemPath: ({ id }) => `${DIRECTORY_PATH}/groups/${enc(id)}`,
    itemsKey: 'groups',
    idField: 'id',
    idHint: 'group e-mail, alias or group id',
    verbs: ['get', 'list', 'create', 'update', 'delete'],
    supportsQuery: true,
    supportsDomain: true,
    maxPageSize: 200,
    createExample: { email: 'sales@example.com', name: 'Sales', description: 'Sales team' },
    extraListParams: ['orderBy', 'sortOrder', 'userKey'],
    fields: GROUP_FIELDS,
  },
  group_member: {
    type: 'group_member',
    label: 'Group member',
    collectionPath: (parent) =>
      `${DIRECTORY_PATH}/groups/${enc(requireParent({ parent, type: 'group_member' }))}/members`,
    itemPath: ({ id, parent }) =>
      `${DIRECTORY_PATH}/groups/${enc(
        requireParent({ parent, type: 'group_member' }),
      )}/members/${enc(id)}`,
    itemsKey: 'members',
    idField: 'id',
    idHint: 'member e-mail or id',
    parentLabel: 'group e-mail or id',
    verbs: ['get', 'list', 'create', 'update', 'delete'],
    supportsQuery: false,
    supportsDomain: false,
    maxPageSize: 200,
    createExample: { email: 'jane.doe@example.com', role: 'MEMBER' },
    extraListParams: ['roles', 'includeDerivedMembership'],
    fields: GROUP_MEMBER_FIELDS,
  },
  org_unit: {
    type: 'org_unit',
    label: 'Organizational unit',
    collectionPath: () => customer('orgunits'),
    itemPath: ({ id }) => customer(`orgunits/${encOrgUnit(id)}`),
    itemsKey: 'organizationUnits',
    idField: 'orgUnitId',
    idHint: 'org unit path (e.g. /Sales/West) or `id:<orgUnitId>`',
    verbs: ['get', 'list', 'create', 'update', 'delete'],
    supportsQuery: false,
    supportsDomain: false,
    createExample: { name: 'West', parentOrgUnitPath: '/Sales', description: 'West coast sales' },
    extraListParams: ['orgUnitPath', 'type'],
    fields: ORG_UNIT_FIELDS,
  },
  mobile_device: {
    type: 'mobile_device',
    label: 'Mobile device',
    collectionPath: () => customer('devices/mobile'),
    itemPath: ({ id }) => customer(`devices/mobile/${enc(id)}`),
    itemsKey: 'mobiledevices',
    idField: 'resourceId',
    idHint: 'device resource id',
    verbs: ['get', 'list', 'delete'],
    supportsQuery: true,
    supportsDomain: false,
    maxPageSize: 100,
    extraListParams: ['orderBy', 'sortOrder', 'projection'],
  },
  chromeos_device: {
    type: 'chromeos_device',
    label: 'Chrome OS device',
    collectionPath: () => customer('devices/chromeos'),
    itemPath: ({ id }) => customer(`devices/chromeos/${enc(id)}`),
    itemsKey: 'chromeosdevices',
    idField: 'deviceId',
    idHint: 'device id',
    verbs: ['get', 'list', 'update'],
    supportsQuery: true,
    supportsDomain: false,
    maxPageSize: 200,
    extraListParams: ['orgUnitPath', 'orderBy', 'sortOrder', 'projection', 'includeChildOrgunits'],
    fields: CHROMEOS_DEVICE_FIELDS,
  },
  role_assignment: {
    type: 'role_assignment',
    label: 'Role assignment',
    collectionPath: () => customer('roleassignments'),
    itemPath: ({ id }) => customer(`roleassignments/${enc(id)}`),
    itemsKey: 'items',
    idField: 'roleAssignmentId',
    idHint: 'role assignment id',
    verbs: ['get', 'list', 'create', 'delete'],
    supportsQuery: false,
    supportsDomain: false,
    maxPageSize: 200,
    createExample: {
      roleId: '12345678901234567',
      assignedTo: '1122334455667788990',
      scopeType: 'CUSTOMER',
    },
    extraListParams: ['roleId', 'userKey', 'includeIndirectRoleAssignments'],
    fields: ROLE_ASSIGNMENT_FIELDS,
  },
};

const RESOURCE_TYPE_OPTIONS: { label: string; value: GoogleWorkspaceResourceType }[] =
  Object.values(RESOURCES).map((def) => ({
    label: def.label,
    value: def.type,
  }));

export const googleWorkspaceUtils = {
  resources: RESOURCES,
  resourceTypeOptions: RESOURCE_TYPE_OPTIONS,
  resourceDefinition,
  assertVerb,
  idOf,
  isRootOrgUnitPath,
  isResourceType,
  parseRecord,
  stringValues,
  assertCustomApiCallUrl,
  buildRecordBody,
  recordBody,
  customFieldKey,
  adminApiRoot: GOOGLE_ADMIN_API_ROOT,
  directoryPath: DIRECTORY_PATH,
  reportsPath: REPORTS_PATH,
  dataTransferPath: DATA_TRANSFER_PATH,
  myCustomer: MY_CUSTOMER,
};
