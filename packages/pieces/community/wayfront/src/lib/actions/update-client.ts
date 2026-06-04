import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wayfrontAuth } from '../auth';
import {
  clientsDropdown,
  flattenUser,
  wayfrontApiClient,
  WayfrontAuthType,
  WayfrontUser,
} from '../common';

export const updateClientAction = createAction({
  auth: wayfrontAuth,
  name: 'update_client',
  displayName: 'Update Client',
  description: 'Updates a client in your Wayfront workspace. Only provided fields are changed.',
  props: {
    user_id: clientsDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    name_f: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    name_l: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      description: 'Numeric ID of the client status. Find status IDs in your Wayfront workspace settings.',
      required: false,
    }),
    referrer_user_id: Property.Number({
      displayName: 'Referrer Team Member ID',
      description: 'ID of the team member who referred this client.',
      required: false,
    }),
    employee_id: Property.ShortText({
      displayName: 'Employee IDs',
      description: 'Comma-separated IDs of employees to assign to this client (e.g. 1,2,3).',
      required: false,
    }),
    tax_id: Property.ShortText({
      displayName: 'Tax ID',
      required: false,
    }),
    balance: Property.Number({
      displayName: 'Balance',
      description: 'Updated account balance for the client.',
      required: false,
    }),
    optin: Property.ShortText({
      displayName: 'Opt-in',
      description: 'Opt-in status, e.g. "Yes" or "No".',
      required: false,
    }),
    stripe_id: Property.ShortText({
      displayName: 'Stripe Customer ID',
      description: 'The Stripe customer ID linked to this client.',
      required: false,
    }),
    created_at: Property.ShortText({
      displayName: 'Created Date',
      description: 'Override the creation date. Format: 2021-09-01T00:00:00+00:00.',
      required: false,
    }),
    address_line_1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    address_city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    address_state: Property.ShortText({
      displayName: 'State / Province',
      required: false,
    }),
    address_postcode: Property.ShortText({
      displayName: 'Postcode / ZIP',
      required: false,
    }),
    address_country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code, e.g. US or GB.',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields as key-value pairs.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const employeeIds = p.employee_id
      ? p.employee_id
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : undefined;

    const hasAddress =
      !isNil(p.address_line_1) ||
      !isNil(p.address_city) ||
      !isNil(p.address_state) ||
      !isNil(p.address_postcode) ||
      !isNil(p.address_country);

    const body = {
      ...(!isNil(p.email) && { email: p.email }),
      ...(!isNil(p.name_f) && { name_f: p.name_f }),
      ...(!isNil(p.name_l) && { name_l: p.name_l }),
      ...(!isNil(p.company) && { company: p.company }),
      ...(!isNil(p.phone) && { phone: p.phone }),
      ...(!isNil(p.note) && { note: p.note }),
      ...(!isNil(p.status_id) && { status_id: p.status_id }),
      ...(!isNil(p.referrer_user_id) && { referrer_user_id: p.referrer_user_id }),
      ...(employeeIds !== undefined && { employee_id: employeeIds }),
      ...(!isNil(p.tax_id) && { tax_id: p.tax_id }),
      ...(!isNil(p.balance) && { balance: p.balance }),
      ...(!isNil(p.optin) && { optin: p.optin }),
      ...(!isNil(p.stripe_id) && { stripe_id: p.stripe_id }),
      ...(!isNil(p.created_at) && { created_at: p.created_at }),
      ...(!isNil(p.custom_fields) && { custom_fields: p.custom_fields }),
      ...(hasAddress && {
        address: {
          ...(!isNil(p.address_line_1) && { line_1: p.address_line_1 }),
          ...(!isNil(p.address_city) && { city: p.address_city }),
          ...(!isNil(p.address_state) && { state: p.address_state }),
          ...(!isNil(p.address_postcode) && { postcode: p.address_postcode }),
          ...(!isNil(p.address_country) && { country: p.address_country }),
        },
      }),
    };

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).put<WayfrontUser>(
      `/clients/${p.user_id}`,
      body,
    );

    return flattenUser(response.body);
  },
});
