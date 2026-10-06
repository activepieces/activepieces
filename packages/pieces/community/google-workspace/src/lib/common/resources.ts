import { HttpMethod } from '@activepieces/pieces-common';

import { DIRECTORY_PATH, GoogleWorkspaceApi, MY_CUSTOMER } from './client';
import type { ResolvedAuth } from './client';

export function resourceDefinition(type: string): ResourceDefinition {
  if (!isResourceType(type)) {
    throw new Error(`Unknown resource type "${type}". Expected one of: ${Object.keys(RESOURCES).join(', ')}.`);
  }
  return RESOURCES[type];
}

export function assertVerb({ def, verb }: { def: ResourceDefinition; verb: Verb }): void {
  if (!def.verbs.includes(verb)) {
    throw new Error(
      `${def.label} records do not support "${verb}" through the Directory API (allowed: ${def.verbs.join(', ')}).`
    );
  }
}

export function idOf({ def, item }: { def: ResourceDefinition; item: Record<string, unknown> }): string | null {
  const value = item[def.idField];
  return value === undefined || value === null ? null : String(value);
}

export async function resolveIdentifier({ def, auth, id }: { def: ResourceDefinition; auth: ResolvedAuth; id: string }): Promise<string> {
  return def.resolveIdentifier ? def.resolveIdentifier({ auth, id }) : id;
}

function isResourceType(value: string): value is ResourceType {
  return Object.prototype.hasOwnProperty.call(RESOURCES, value);
}

function customer(segment: string): string {
  return `${DIRECTORY_PATH}/customer/${MY_CUSTOMER}/${segment}`;
}

function enc(value: string): string {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') {
    throw new Error('The record identifier is empty. Fill it in (or check the step it comes from produced a value).');
  }
  return encodeURIComponent(trimmed);
}

function encOrgUnit(path: string): string {
  return enc(
    String(path ?? '')
      .trim()
      .replace(/^\//, '')
  );
}

function isRootOrgUnitPath(id: string): boolean {
  return String(id ?? '').trim() === '/';
}

async function rootOrgUnitId(auth: ResolvedAuth): Promise<string> {
  const response = await GoogleWorkspaceApi.request<Record<string, unknown>>({
    auth,
    method: HttpMethod.GET,
    path: customer('orgunits'),
    query: { type: 'allIncludingParent' },
  });
  const units: unknown = response['organizationUnits'];
  const root: unknown = (Array.isArray(units) ? units : []).find(
    (unit: unknown) => typeof unit === 'object' && unit !== null && Reflect.get(unit, 'orgUnitPath') === '/'
  );
  const rootId: unknown = typeof root === 'object' && root !== null ? Reflect.get(root, 'orgUnitId') : undefined;
  if (typeof rootId !== 'string' || rootId === '') {
    throw new Error('Could not read the ID of the root organizational unit (/) from Google. Use its ID (id:...) instead of /.');
  }
  return rootId;
}

function requireParent({ parent, type }: { parent: string | undefined; type: ResourceType }): string {
  const value = String(parent ?? '').trim();
  if (!value) {
    throw new Error(`"${RESOURCES[type].label}" needs the parent record: fill in the ${RESOURCES[type].parentLabel}.`);
  }
  return value;
}

export const RESOURCES: Record<ResourceType, ResourceDefinition> = {
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
    extraListParams: ['orderBy', 'sortOrder', 'projection', 'customFieldMask', 'showDeleted', 'viewType'],
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
    collectionPath: (parent) => `${DIRECTORY_PATH}/groups/${enc(requireParent({ parent, type: 'group_member' }))}/members`,
    itemPath: ({ id, parent }) =>
      `${DIRECTORY_PATH}/groups/${enc(requireParent({ parent, type: 'group_member' }))}/members/${enc(id)}`,
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
    resolveIdentifier: ({ auth, id }) => (isRootOrgUnitPath(id) ? rootOrgUnitId(auth) : Promise.resolve(id)),
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
    createExample: { roleId: '12345678901234567', assignedTo: '1122334455667788990', scopeType: 'CUSTOMER' },
    extraListParams: ['roleId', 'userKey', 'includeIndirectRoleAssignments'],
  },
};

export const resourceTypeOptions: { label: string; value: ResourceType }[] = Object.values(RESOURCES).map((def) => ({
  label: def.label,
  value: def.type,
}));

export type ResourceType =
  | 'user'
  | 'group'
  | 'group_member'
  | 'org_unit'
  | 'mobile_device'
  | 'chromeos_device'
  | 'role_assignment';

export type Verb = 'get' | 'list' | 'create' | 'update' | 'delete';

export type ResourceDefinition = {
  type: ResourceType;
  label: string;
  collectionPath: (parent?: string) => string;
  itemPath: (params: { id: string; parent?: string }) => string;
  resolveIdentifier?: (params: { auth: ResolvedAuth; id: string }) => Promise<string>;
  itemsKey: string;
  idField: string;
  idHint: string;
  parentLabel?: string;
  verbs: Verb[];
  supportsQuery: boolean;
  supportsDomain: boolean;
  maxPageSize?: number;
  createExample?: Record<string, unknown>;
  extraListParams?: string[];
};
