import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { JsonPatchOperation, nutshellApiCall, nutshellPatch, unwrapFirst } from '../common/client';

export const updateLead = createAction({
  auth: nutshellAuth,
  name: 'updateLead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead in Nutshell.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates fields on an existing Nutshell lead identified by its ID; only the supplied fields are changed. Account, contact, and tag IDs are added as additional links rather than replacing existing ones. Idempotent: applying the same values repeatedly leaves the lead in the same state.',
    idempotent: true,
  },
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to update, e.g. "123-leads".',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    manualValue: Property.ShortText({
      displayName: 'Value',
      description: 'Manual value override for the lead, e.g. "500.00".',
      required: false,
    }),
    addAccountIds: Property.Array({
      displayName: 'Account IDs to Add',
      description: 'IDs of companies to link to this lead, e.g. "12-accounts".',
      required: false,
    }),
    addContactIds: Property.Array({
      displayName: 'Contact IDs to Add',
      description: 'IDs of contacts to link to this lead, e.g. "34-contacts".',
      required: false,
    }),
    addTagIds: Property.Array({
      displayName: 'Tag IDs to Add',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Key-value pairs matching custom field names configured in Nutshell. Each key is replaced with the provided value.',
      required: false,
    }),
  },
  async run(context) {
    const { leadId, description, manualValue, addAccountIds, addContactIds, addTagIds, customFields } =
      context.propsValue;

    const operations: JsonPatchOperation[] = [];

    if (description) {
      operations.push({ op: 'replace', path: '/leads/0/description', value: description });
    }
    if (manualValue) {
      operations.push({ op: 'replace', path: '/leads/0/manualValue', value: manualValue });
    }
    if (customFields) {
      for (const [key, value] of Object.entries(customFields as Record<string, unknown>)) {
        operations.push({ op: 'replace', path: `/leads/0/customFields/${key}`, value });
      }
    }
    for (const id of addAccountIds ?? []) {
      operations.push({ op: 'add', path: '/leads/0/links/accounts/-', value: id });
    }
    for (const id of addContactIds ?? []) {
      operations.push({ op: 'add', path: '/leads/0/links/contacts/-', value: id });
    }
    for (const id of addTagIds ?? []) {
      operations.push({ op: 'add', path: '/leads/0/links/tags/-', value: id });
    }

    if (operations.length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    await nutshellPatch({
      auth: context.auth,
      resourceUri: `/leads/${leadId}`,
      operations,
    });

    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/leads/${leadId}`,
    });
    return unwrapFirst(response, 'leads');
  },
});
