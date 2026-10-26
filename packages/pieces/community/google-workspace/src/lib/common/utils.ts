import type {
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
  parseRecord,
  stringValues,
  assertCustomApiCallUrl,
  adminApiRoot: GOOGLE_ADMIN_API_ROOT,
  directoryPath: DIRECTORY_PATH,
  reportsPath: REPORTS_PATH,
  dataTransferPath: DATA_TRANSFER_PATH,
  myCustomer: MY_CUSTOMER,
};
