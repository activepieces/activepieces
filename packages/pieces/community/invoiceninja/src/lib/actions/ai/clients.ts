import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';

const CLEARABLE = ['website', 'phone', 'vat_number', 'id_number', 'address1', 'address2', 'city', 'state', 'postal_code', 'public_notes', 'private_notes'] as const;

export const getClientAi = createAction({
  auth: invoiceninjaAuth,
  name: 'get_client',
  classification: 'READ',
  displayName: 'Get Client',
  description: 'Get one client by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja client by its ID, with address, balances and contacts. Use Find Clients first if you only know a name or email. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.client,
  props: { id: entityActions.getIdProp('Client') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'clients', label: 'Client', id: propsValue.id });
  },
});

export const findClients = createAction({
  auth: invoiceninjaAuth,
  name: 'find_clients',
  classification: 'SEARCH',
  displayName: 'Find Clients',
  description: 'Search clients by text or exact contact email, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Invoice Ninja clients. search matches name, number, contact names and emails; email matches a contact email exactly. Returns {items, page, perPage, total, hasMore}; request the next page while hasMore is true. Active clients only unless status says otherwise. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.clientList,
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Free-text filter.', required: false }),
    email: Property.ShortText({ displayName: 'Contact Email', description: 'Exact contact email.', required: false }),
    status: entityActions.statusProp(),
    sort: entityActions.sortProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'clients',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        email: invoiceNinjaClient.optionalText(propsValue.email),
        status: propsValue.status,
        sort: propsValue.sort,
      },
    });
  },
});

export const updateClient = createAction({
  auth: invoiceninjaAuth,
  name: 'update_client',
  classification: 'WRITE',
  displayName: 'Update Client',
  description: 'Change fields of an existing client. Empty fields are left unchanged.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an Invoice Ninja client by ID. Only fields you pass are changed; list field names in clear_fields to blank them. Contacts are not changed here. Returns the updated client. Idempotent: repeating the same update gives the same result.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.client,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    vat_number: Property.ShortText({ displayName: 'VAT Number', required: false }),
    id_number: Property.ShortText({ displayName: 'ID Number', required: false }),
    address1: Property.ShortText({ displayName: 'Address Line 1', required: false }),
    address2: Property.ShortText({ displayName: 'Address Line 2', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State', required: false }),
    postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
    public_notes: Property.LongText({ displayName: 'Public Notes', required: false }),
    private_notes: Property.LongText({ displayName: 'Private Notes', required: false }),
    clear_fields: invoiceNinjaProps.clearProp({ fields: CLEARABLE }),
  },
  async run({ auth, propsValue }) {
    const id = invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client ID' });
    const set = invoiceNinjaClient.compact({
      name: invoiceNinjaClient.optionalText(propsValue.name),
      ...Object.fromEntries(CLEARABLE.map((field) => [field, invoiceNinjaClient.optionalText(propsValue[field])])),
    });
    const body = { ...invoiceNinjaClient.clearedFields({ value: propsValue.clear_fields, allowed: CLEARABLE }), ...set };
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: give at least one field or clear_fields.');
    }
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.PUT, path: `/clients/${id}`, body }),
    );
  },
});

export const archiveClient = createAction({
  auth: invoiceninjaAuth,
  name: 'archive_client',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Client',
  description: 'Archive a client (hidden from lists, can be restored).',
  audience: 'ai',
  aiMetadata: {
    description: 'Archives an Invoice Ninja client by ID; it disappears from active lists and can be brought back with Restore Client. Returns the client. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.client,
  props: { id: entityActions.bulkIdProp('Client') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'clients', label: 'Client', action: 'archive', id: propsValue.id });
  },
});

export const restoreClient = createAction({
  auth: invoiceninjaAuth,
  name: 'restore_client',
  classification: 'WRITE',
  displayName: 'Restore Client',
  description: 'Restore an archived or deleted client.',
  audience: 'ai',
  aiMetadata: {
    description: 'Restores an archived or deleted Invoice Ninja client by ID back to active. Returns the client. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.client,
  props: { id: entityActions.bulkIdProp('Client') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'clients', label: 'Client', action: 'restore', id: propsValue.id });
  },
});

export const deleteClient = createAction({
  auth: invoiceninjaAuth,
  name: 'delete_client',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Client',
  description: 'Delete a client (soft delete, can be restored).',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes an Invoice Ninja client by ID (soft delete: is_deleted becomes true; its existing invoices are not deleted). Can be undone with Restore Client. Returns the client. Ask the user before calling.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.client,
  props: { id: entityActions.bulkIdProp('Client') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'clients', label: 'Client', action: 'delete', id: propsValue.id });
  },
});
