import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { wayfrontAuth } from '../auth';

function buildBaseUrl(workspaceUrl: string) {
  const host = workspaceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${host}/api`;
}

async function makeRequest<T>({
  workspaceUrl,
  apiToken,
  method,
  path,
  body,
  queryParams,
}: {
  workspaceUrl: string;
  apiToken: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}) {
  const baseUrl = buildBaseUrl(workspaceUrl);
  return httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${path}`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body as Record<string, unknown>,
    queryParams,
  });
}

async function validateAuth(
  workspaceUrl: string,
  apiToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await makeRequest<unknown>({
      workspaceUrl,
      apiToken,
      method: HttpMethod.GET,
      path: '/team',
      queryParams: { limit: '1' },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Invalid workspace URL or API token.' };
  }
}

export function wayfrontApiClient(workspaceUrl: string, apiToken: string) {
  return {
    get: <T>(path: string, queryParams?: Record<string, string>) =>
      makeRequest<T>({ workspaceUrl, apiToken, method: HttpMethod.GET, path, queryParams }),
    post: <T>(path: string, body?: unknown) =>
      makeRequest<T>({ workspaceUrl, apiToken, method: HttpMethod.POST, path, body }),
    put: <T>(path: string, body?: unknown) =>
      makeRequest<T>({ workspaceUrl, apiToken, method: HttpMethod.PUT, path, body }),
    delete: <T>(path: string) =>
      makeRequest<T>({ workspaceUrl, apiToken, method: HttpMethod.DELETE, path }),
    validateAuth: () => validateAuth(workspaceUrl, apiToken),
  };
}

export const teamMembersDropdown = Property.Dropdown({
  displayName: 'Assigned To',
  description: 'Select a team member to assign this activity to.',
  refreshers: [],
  auth: wayfrontAuth,
  required: false,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
    }
    const { workspaceUrl, apiToken } = auth as unknown as WayfrontAuthType;
    try {
      const response = await wayfrontApiClient(workspaceUrl, apiToken).get<
        WayfrontListResponse<WayfrontUser>
      >('/team', { limit: '100' });
      return {
        disabled: false,
        options: response.body.data.map((member) => ({
          label: member.name ? `${member.name} (${member.email})` : member.email,
          value: member.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load team members. Check your connection.',
      };
    }
  },
});

export const clientsDropdown = Property.Dropdown({
  displayName: 'Client',
  description: 'Select a client from your Wayfront workspace.',
  refreshers: [],
  auth: wayfrontAuth,
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
    }
    const { workspaceUrl, apiToken } = auth as unknown as WayfrontAuthType;
    try {
      const response = await wayfrontApiClient(workspaceUrl, apiToken).get<
        WayfrontListResponse<WayfrontUser>
      >('/clients', { limit: '100' });
      return {
        disabled: false,
        options: response.body.data.map((client) => ({
          label: client.name ? `${client.name} (${client.email})` : client.email,
          value: client.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load clients. Check your connection.',
      };
    }
  },
});

export const activitiesDropdown = Property.Dropdown({
  displayName: 'Activity',
  description: 'Select an activity for the chosen client.',
  refreshers: ['user_id'],
  auth: wayfrontAuth,
  required: true,
  options: async ({ auth, user_id }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
    }
    if (!user_id) {
      return { disabled: true, options: [], placeholder: 'Please select a client first.' };
    }
    const { workspaceUrl, apiToken } = auth as unknown as WayfrontAuthType;
    try {
      const response = await wayfrontApiClient(workspaceUrl, apiToken).get<
        WayfrontListResponse<WayfrontActivity>
      >(`/clients/${user_id}/activities`, { limit: '100' });
      return {
        disabled: false,
        options: response.body.data.map((activity) => ({
          label: `#${activity.id}: ${activity.content.length > 60 ? activity.content.slice(0, 60) + '…' : activity.content}`,
          value: activity.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load activities. Check your connection.',
      };
    }
  },
});

export const ticketsDropdown = Property.Dropdown({
  displayName: 'Ticket',
  description: 'Select a ticket from your Wayfront workspace.',
  refreshers: [],
  auth: wayfrontAuth,
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
    }
    const { workspaceUrl, apiToken } = auth as unknown as WayfrontAuthType;
    try {
      const response = await wayfrontApiClient(workspaceUrl, apiToken).get<
        WayfrontListResponse<WayfrontTicket>
      >('/tickets', { limit: '100' });
      return {
        disabled: false,
        options: response.body.data.map((ticket) => ({
          label: `#${ticket.number ?? ticket.id}: ${ticket.subject}`,
          value: ticket.number ?? String(ticket.id),
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load tickets. Check your connection.',
      };
    }
  },
});

export function flattenUser(user: WayfrontUser) {
  return {
    id: user.id,
    name: user.name,
    first_name: user.name_f,
    last_name: user.name_l,
    email: user.email,
    company: user.company ?? null,
    phone: user.phone ?? null,
    tax_id: user.tax_id ?? null,
    affiliate_link: user.aff_link ?? null,
    note: user.note ?? null,
    balance: user.balance ?? null,
    optin: user.optin ?? null,
    stripe_id: user.stripe_id ?? null,
    status: user.status ?? null,
    status_id: user.status_id ?? null,
    role_id: user.role_id ?? null,
    referrer_user_id: user.referrer_user_id ?? null,
    employee_id: user.employee_id ?? null,
    spent: user.spent ?? null,
    address_line_1: user.address?.line_1 ?? null,
    address_line_2: user.address?.line_2 ?? null,
    address_city: user.address?.city ?? null,
    address_state: user.address?.state ?? null,
    address_postcode: user.address?.postcode ?? null,
    address_country: user.address?.country ?? null,
    team_member_ids: Array.isArray(user.team_member_ids)
      ? user.team_member_ids.join(', ')
      : null,
    team_owner_ids: Array.isArray(user.team_owner_ids)
      ? user.team_owner_ids.join(', ')
      : null,
    created_at: user.created_at,
  };
}

export type WayfrontAuthType = {
  workspaceUrl: string;
  apiToken: string;
};

export type WayfrontAddress = {
  line_1: string;
  line_2: string;
  city: string;
  country: string;
  state: string;
  postcode: string;
  name_f: string;
  name_l: string;
  tax_id: string;
  company_name: string;
  company_vat: string;
};

export type WayfrontUser = {
  id: number;
  referrer_user_id: number | null;
  aff_link: string;
  created_at: string;
  name_f: string;
  name_l: string;
  email: string;
  company: string;
  tax_id: string;
  phone: string;
  address: WayfrontAddress;
  note: string;
  balance: number;
  optin: string;
  stripe_id: string;
  custom_fields: Record<string, unknown>;
  status: number;
  status_id: number;
  role_id: number;
  name: string;
  spent: string | null;
  employee_id: number;
  team_owner_ids: number[];
  team_member_ids: number[];
};

export type WayfrontActivityParticipant = {
  id: number;
  name: string;
  email: string;
};

export type WayfrontActivity = {
  id: number;
  content: string;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  author: WayfrontActivityParticipant | null;
  assignee: WayfrontActivityParticipant | null;
};

export function flattenActivity(activity: WayfrontActivity) {
  return {
    id: activity.id,
    content: activity.content,
    scheduled_at: activity.scheduled_at ?? null,
    completed_at: activity.completed_at ?? null,
    created_at: activity.created_at,
    updated_at: activity.updated_at,
    author_id: activity.author?.id ?? null,
    author_name: activity.author?.name ?? null,
    author_email: activity.author?.email ?? null,
    assignee_id: activity.assignee?.id ?? null,
    assignee_name: activity.assignee?.name ?? null,
    assignee_email: activity.assignee?.email ?? null,
  };
}

export type WayfrontTicketEmployee = {
  id: number;
  name_f: string;
  name_l: string;
  group_id: number;
  role_id: number;
};

export type WayfrontTicket = {
  id: number;
  number?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  date_closed: string;
  subject: string;
  user_id: number;
  client?: WayfrontUser;
  form_data: Record<string, unknown>;
  tags: string[];
  note: string;
  employees: WayfrontTicketEmployee[];
  status: string;
  status_id: number;
  source: string;
  order_id: number;
  metadata: Record<string, unknown>;
};

export function flattenTicket(ticket: WayfrontTicket) {
  return {
    id: ticket.id,
    number: ticket.number ?? null,
    subject: ticket.subject,
    user_id: ticket.user_id,
    client_name: ticket.client?.name ?? null,
    client_email: ticket.client?.email ?? null,
    status: ticket.status ?? null,
    status_id: ticket.status_id ?? null,
    source: ticket.source ?? null,
    order_id: ticket.order_id ?? null,
    note: ticket.note ?? null,
    tags: Array.isArray(ticket.tags) ? ticket.tags.join(', ') : null,
    employees: Array.isArray(ticket.employees)
      ? ticket.employees
          .map((e) => [e.name_f, e.name_l].filter(Boolean).join(' ') || String(e.id))
          .join(', ')
      : null,
    last_message_at: ticket.last_message_at ?? null,
    date_closed: ticket.date_closed ?? null,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

export type WayfrontIndexOrder = {
  id: number;
  number?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  date_started: string;
  date_completed: string;
  date_due: string;
  client?: WayfrontUser;
  tags: string[];
  status: string;
  status_id: number;
  price: number;
  quantity: number;
  invoice_id: number;
  service: string;
  service_id: number;
  user_id: number;
  employees: WayfrontTicketEmployee[];
  note: string;
  form_data: Record<string, unknown>;
  paysys: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  linked_orders?: string[];
};

export function flattenOrder(order: WayfrontIndexOrder) {
  return {
    id: order.id,
    number: order.number ?? null,
    service: order.service ?? null,
    service_id: order.service_id ?? null,
    user_id: order.user_id,
    client_name: order.client?.name ?? null,
    client_email: order.client?.email ?? null,
    status: order.status ?? null,
    status_id: order.status_id ?? null,
    price: order.price ?? null,
    quantity: order.quantity ?? null,
    invoice_id: order.invoice_id ?? null,
    note: order.note ?? null,
    paysys: order.paysys ?? null,
    currency: order.currency ?? null,
    tags: Array.isArray(order.tags) ? order.tags.join(', ') : null,
    employees: Array.isArray(order.employees)
      ? order.employees
          .map((e) => [e.name_f, e.name_l].filter(Boolean).join(' ') || String(e.id))
          .join(', ')
      : null,
    linked_orders: Array.isArray(order.linked_orders) ? order.linked_orders.join(', ') : null,
    date_started: order.date_started ?? null,
    date_completed: order.date_completed ?? null,
    date_due: order.date_due ?? null,
    last_message_at: order.last_message_at ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export const ordersDropdown = Property.Dropdown({
  displayName: 'Order',
  description: 'Select an order from your Wayfront workspace.',
  refreshers: [],
  auth: wayfrontAuth,
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
    }
    const { workspaceUrl, apiToken } = auth as unknown as WayfrontAuthType;
    try {
      const response = await wayfrontApiClient(workspaceUrl, apiToken).get<
        WayfrontListResponse<WayfrontIndexOrder>
      >('/orders', { limit: '100' });
      return {
        disabled: false,
        options: response.body.data.map((order) => ({
          label: `#${order.number ?? order.id}: ${order.service}`,
          value: order.number ?? String(order.id),
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load orders. Check your connection.',
      };
    }
  },
});

export type WayfrontListResponse<T> = {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
};
