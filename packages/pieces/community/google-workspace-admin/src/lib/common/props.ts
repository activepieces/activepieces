import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownState, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth, GoogleWorkspaceAdminAuthValue } from '../auth';
import {
  AdminRole,
  DATA_TRANSFER_URL,
  DIRECTORY_URL,
  DirectoryGroup,
  DirectoryUser,
  googleAdminClient,
  GroupMember,
  OrgUnit,
  RoleAssignment,
} from './client';

function user<R extends boolean>({
  displayName = 'User',
  description = 'Pick a user, or type to search by name or email. You can also enter a primary email, alias or user ID.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, ctx) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const users = await googleAdminClient.listAll<{ nextPageToken?: string; users?: DirectoryUser[] }, DirectoryUser>({
            auth: connection,
            url: `${DIRECTORY_URL}/users`,
            getItems: (r) => r.users,
            queryParams: { customer: 'my_customer', orderBy: 'email', query: ctx.searchValue?.trim() },
            limit: DROPDOWN_LIMIT,
          });
          return users.map((u) => ({
            label: u.name?.fullName ? `${u.name.fullName} (${u.primaryEmail})` : u.primaryEmail,
            value: u.primaryEmail,
          }));
        },
      }),
  });
}

function group<R extends boolean>({
  displayName = 'Group',
  description = 'Pick a group, or type to search by name or email. You can also enter a group email, alias or group ID.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, ctx) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const search = ctx.searchValue?.trim().replace(/'/g, '');
          const groups = await googleAdminClient.listAll<{ nextPageToken?: string; groups?: DirectoryGroup[] }, DirectoryGroup>({
            auth: connection,
            url: `${DIRECTORY_URL}/groups`,
            getItems: (r) => r.groups,
            queryParams: {
              customer: 'my_customer',
              orderBy: 'email',
              query: search ? `name:'${search}*'` : undefined,
            },
            limit: DROPDOWN_LIMIT,
          });
          return groups.map((g) => ({ label: `${g.name} (${g.email})`, value: g.email }));
        },
      }),
  });
}

function member<R extends boolean>({
  displayName = 'Member',
  description = 'Pick a member of the selected group. You can also enter the member email or ID.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: ['group'],
    options: async ({ auth, group }) => {
      if (typeof group !== 'string' || group === '') {
        return { disabled: true, options: [], placeholder: 'Please select a group first' };
      }
      return loadOptions({
        auth,
        load: async (connection) => {
          const members = await googleAdminClient.listAll<{ nextPageToken?: string; members?: GroupMember[] }, GroupMember>({
            auth: connection,
            url: `${DIRECTORY_URL}/groups/${encodeURIComponent(group)}/members`,
            getItems: (r) => r.members,
            limit: DROPDOWN_LIMIT,
          });
          return members.map((m) => ({
            label: `${m.email ?? m.id} (${m.role ?? 'MEMBER'})`,
            value: m.email ?? m.id,
          }));
        },
      });
    },
  });
}

function orgUnit<R extends boolean>({
  displayName = 'Organizational Unit',
  description = 'Pick an organizational unit.',
  required,
  valueField,
  includeRoot = false,
}: DropdownParams<R> & { valueField: 'orgUnitPath' | 'orgUnitId'; includeRoot?: boolean }) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const response = await googleAdminClient.request<{ organizationUnits?: OrgUnit[] }>({
            auth: connection,
            method: HttpMethod.GET,
            url: `${DIRECTORY_URL}/customer/my_customer/orgunits`,
            queryParams: { type: 'all' },
          });
          const units = (response.organizationUnits ?? [])
            .sort((a, b) => a.orgUnitPath.localeCompare(b.orgUnitPath))
            .map((u) => ({ label: u.orgUnitPath, value: u[valueField] }));
          return includeRoot ? [{ label: '/ (top level)', value: '/' }, ...units] : units;
        },
      }),
  });
}

function role<R extends boolean>({
  displayName = 'Admin Role',
  description = 'Pick an admin role.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const roles = await googleAdminClient.listAll<{ nextPageToken?: string; items?: AdminRole[] }, AdminRole>({
            auth: connection,
            url: `${DIRECTORY_URL}/customer/my_customer/roles`,
            getItems: (r) => r.items,
          });
          return roles.map((r) => ({ label: r.roleName, value: r.roleId }));
        },
      }),
  });
}

function roleAssignment<R extends boolean>({
  displayName = 'Role Assignment',
  description = "Pick one of the selected user's admin role assignments.",
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: ['user'],
    options: async ({ auth, user }) => {
      if (typeof user !== 'string' || user === '') {
        return { disabled: true, options: [], placeholder: 'Please select a user first' };
      }
      return loadOptions({
        auth,
        load: async (connection) => {
          const [roles, assignments] = await Promise.all([
            googleAdminClient.listAll<{ nextPageToken?: string; items?: AdminRole[] }, AdminRole>({
              auth: connection,
              url: `${DIRECTORY_URL}/customer/my_customer/roles`,
              getItems: (r) => r.items,
            }),
            googleAdminClient.listAll<{ nextPageToken?: string; items?: RoleAssignment[] }, RoleAssignment>({
              auth: connection,
              url: `${DIRECTORY_URL}/customer/my_customer/roleassignments`,
              getItems: (r) => r.items,
              queryParams: { userKey: user },
            }),
          ]);
          const roleNames = new Map(roles.map((r) => [r.roleId, r.roleName]));
          return assignments.map((a) => ({
            label: `${roleNames.get(a.roleId) ?? a.roleId} (${a.scopeType === 'ORG_UNIT' ? 'org unit' : 'whole organization'})`,
            value: a.roleAssignmentId,
          }));
        },
      });
    },
  });
}

function appPassword<R extends boolean>({
  displayName = 'App Password',
  description = "Pick one of the selected user's app passwords.",
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<number, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: ['user'],
    options: async ({ auth, user }) => {
      if (typeof user !== 'string' || user === '') {
        return { disabled: true, options: [], placeholder: 'Please select a user first' };
      }
      return loadOptions({
        auth,
        load: async (connection) => {
          const response = await googleAdminClient.request<{ items?: { codeId: number; name: string }[] }>({
            auth: connection,
            method: HttpMethod.GET,
            url: `${DIRECTORY_URL}/users/${encodeURIComponent(user)}/asps`,
          });
          return (response.items ?? []).map((a) => ({ label: a.name, value: a.codeId }));
        },
      });
    },
  });
}

function token<R extends boolean>({
  displayName = 'Connected App',
  description = 'Pick one of the third-party apps the selected user has granted access to.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: ['user'],
    options: async ({ auth, user }) => {
      if (typeof user !== 'string' || user === '') {
        return { disabled: true, options: [], placeholder: 'Please select a user first' };
      }
      return loadOptions({
        auth,
        load: async (connection) => {
          const response = await googleAdminClient.request<{ items?: { clientId: string; displayText?: string }[] }>({
            auth: connection,
            method: HttpMethod.GET,
            url: `${DIRECTORY_URL}/users/${encodeURIComponent(user)}/tokens`,
          });
          return (response.items ?? []).map((t) => ({ label: t.displayText ?? t.clientId, value: t.clientId }));
        },
      });
    },
  });
}

function mobileDevice<R extends boolean>({
  displayName = 'Mobile Device',
  description = 'Pick a mobile device managed by your organization.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, ctx) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const devices = await googleAdminClient.listAll<
            { nextPageToken?: string; mobiledevices?: MobileDeviceSummary[] },
            MobileDeviceSummary
          >({
            auth: connection,
            url: `${DIRECTORY_URL}/customer/my_customer/devices/mobile`,
            getItems: (r) => r.mobiledevices,
            queryParams: { projection: 'BASIC', query: ctx.searchValue?.trim() },
            limit: DROPDOWN_LIMIT,
          });
          return devices.map((d) => ({
            label: `${d.model ?? d.type ?? 'Device'} – ${(d.email ?? []).join(', ') || d.deviceId}`,
            value: d.resourceId,
          }));
        },
      }),
  });
}

function domain<R extends boolean>({
  displayName = 'Domain',
  description = 'Pick one of your verified domains.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const response = await googleAdminClient.request<{ domains?: { domainName: string; isPrimary?: boolean }[] }>({
            auth: connection,
            method: HttpMethod.GET,
            url: `${DIRECTORY_URL}/customer/my_customer/domains`,
          });
          return (response.domains ?? []).map((d) => ({
            label: d.isPrimary ? `${d.domainName} (primary)` : d.domainName,
            value: d.domainName,
          }));
        },
      }),
  });
}

function dataTransferApp<R extends boolean>({
  displayName = 'Application',
  description = 'The app whose data should be transferred.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAdminAuth>({
    auth: googleWorkspaceAdminAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        load: async (connection) => {
          const customerId = await googleAdminClient.getCustomerId({ auth: connection });
          const apps = await googleAdminClient.listAll<
            { nextPageToken?: string; applications?: { id: string; name: string }[] },
            { id: string; name: string }
          >({
            auth: connection,
            url: `${DATA_TRANSFER_URL}/applications`,
            getItems: (r) => r.applications,
            queryParams: { customerId },
          });
          return apps.map((a) => ({ label: a.name, value: String(a.id) }));
        },
      }),
  });
}

function product<R extends boolean>({
  displayName = 'Product',
  description = 'The Google product the license belongs to.',
  required,
}: DropdownParams<R>) {
  return Property.StaticDropdown<string, R>({
    displayName,
    description,
    required,
    defaultValue: 'Google-Apps',
    options: {
      options: LICENSE_PRODUCTS.map((p) => ({ label: p.name, value: p.productId })),
    },
  });
}

function sku<R extends boolean>({
  displayName = 'License (SKU)',
  description = 'The license edition. If yours is missing, switch this field to a custom value and enter the SKU ID from https://developers.google.com/admin-sdk/licensing/v1/how-tos/products.',
  required,
}: DropdownParams<R>) {
  return Property.Dropdown<string, R, undefined>({
    auth: undefined,
    displayName,
    description,
    required,
    refreshers: ['product'],
    options: async ({ product }) => {
      const match = LICENSE_PRODUCTS.find((p) => p.productId === product);
      if (!match) {
        return { disabled: true, options: [], placeholder: 'Please select a product first' };
      }
      return {
        disabled: false,
        options: match.skus.map((s) => ({ label: s.name, value: s.skuId })),
      };
    },
  });
}

async function loadOptions<T>({
  auth,
  load,
}: {
  auth: GoogleWorkspaceAdminAuthValue | undefined;
  load: (auth: GoogleWorkspaceAdminAuthValue) => Promise<{ label: string; value: T }[]>;
}): Promise<DropdownState<T>> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Please connect your account first' };
  }
  try {
    return { disabled: false, options: await load(auth) };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: 'Could not load options. Check that the connection belongs to a Workspace admin.',
    };
  }
}

const DROPDOWN_LIMIT = 100;

export const LICENSE_PRODUCTS: { productId: string; name: string; skus: { skuId: string; name: string }[] }[] = [
  {
    productId: 'Google-Apps',
    name: 'Google Workspace',
    skus: [
      { skuId: '1010020027', name: 'Business Starter' },
      { skuId: '1010020028', name: 'Business Standard' },
      { skuId: '1010020025', name: 'Business Plus' },
      { skuId: '1010060003', name: 'Enterprise Essentials' },
      { skuId: '1010060005', name: 'Enterprise Essentials Plus' },
      { skuId: '1010020026', name: 'Enterprise Standard' },
      { skuId: '1010020020', name: 'Enterprise Plus' },
      { skuId: '1010060001', name: 'Essentials' },
      { skuId: '1010020030', name: 'Frontline Starter' },
      { skuId: '1010020031', name: 'Frontline Standard' },
      { skuId: 'Google-Apps-For-Business', name: 'G Suite Basic' },
      { skuId: 'Google-Apps-Unlimited', name: 'G Suite Business' },
      { skuId: 'Google-Apps-Lite', name: 'G Suite Lite' },
    ],
  },
  {
    productId: 'Google-Vault',
    name: 'Google Vault',
    skus: [
      { skuId: 'Google-Vault', name: 'Google Vault' },
      { skuId: 'Google-Vault-Former-Employee', name: 'Google Vault – Former Employee' },
    ],
  },
  {
    productId: '101033',
    name: 'Google Voice',
    skus: [
      { skuId: '1010330003', name: 'Voice Starter' },
      { skuId: '1010330004', name: 'Voice Standard' },
      { skuId: '1010330002', name: 'Voice Premier' },
    ],
  },
  {
    productId: '101001',
    name: 'Cloud Identity Premium',
    skus: [{ skuId: '1010010001', name: 'Cloud Identity Premium' }],
  },
  {
    productId: '101038',
    name: 'AppSheet',
    skus: [
      { skuId: '1010380001', name: 'AppSheet Core' },
      { skuId: '1010380002', name: 'AppSheet Enterprise Standard' },
      { skuId: '1010380003', name: 'AppSheet Enterprise Plus' },
    ],
  },
];

export const googleAdminProps = {
  user,
  group,
  member,
  orgUnit,
  role,
  roleAssignment,
  appPassword,
  token,
  mobileDevice,
  domain,
  dataTransferApp,
  product,
  sku,
};

type DropdownParams<R extends boolean> = {
  displayName?: string;
  description?: string;
  required: R;
};

type MobileDeviceSummary = {
  resourceId: string;
  deviceId?: string;
  model?: string;
  type?: string;
  email?: string[];
};
