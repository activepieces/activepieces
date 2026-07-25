import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import {
  escapeJsonPointerSegment,
  JsonPatchOperation,
  nutshellApiCall,
  nutshellPatch,
  unwrapFirst,
} from '../common/client';

export const updateCompany = createAction({
  auth: nutshellAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Updates an existing company (account) in Nutshell.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates fields on an existing Nutshell company identified by its ID; only the supplied fields are changed. Phone, email, website, and address, when provided, replace the company\'s existing values for that field. Contact IDs are added as additional links rather than replacing existing ones. Idempotent: applying the same values repeatedly leaves the company in the same state.',
    idempotent: true,
  },
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to update, e.g. "123-accounts".',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Replaces the company\'s primary phone number.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Replaces the company\'s primary email address.',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website URL',
      description: 'Replaces the company\'s primary website URL.',
      required: false,
    }),
    addressLine1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Replaces the company\'s primary address. Provide all address fields together.',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State / Province',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    addContactIds: Property.Array({
      displayName: 'Contact IDs to Add',
      description: 'IDs of contacts to link to this company, e.g. "34-contacts".',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Key-value pairs matching custom field names configured in Nutshell. Each key is replaced with the provided value.',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      name,
      description,
      phone,
      email,
      website,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      addContactIds,
      customFields,
    } = context.propsValue;

    const operations: JsonPatchOperation[] = [];

    if (name !== undefined) {
      operations.push({ op: 'replace', path: '/accounts/0/name', value: name });
    }
    if (description !== undefined) {
      operations.push({ op: 'replace', path: '/accounts/0/description', value: description });
    }
    if (phone !== undefined) {
      operations.push({
        op: 'replace',
        path: '/accounts/0/phones',
        value: [{ isPrimary: true, value: phone }],
      });
    }
    if (email !== undefined) {
      operations.push({
        op: 'replace',
        path: '/accounts/0/emails',
        value: [{ value: email }],
      });
    }
    if (website !== undefined) {
      operations.push({
        op: 'replace',
        path: '/accounts/0/urls',
        value: [{ value: website }],
      });
    }
    if (
      addressLine1 !== undefined ||
      city !== undefined ||
      state !== undefined ||
      postalCode !== undefined ||
      country !== undefined
    ) {
      operations.push({
        op: 'replace',
        path: '/accounts/0/addresses',
        value: [
          {
            isPrimary: true,
            value: { address_1: addressLine1, city, state, postalCode, country },
          },
        ],
      });
    }
    if (customFields) {
      for (const [key, value] of Object.entries(customFields as Record<string, unknown>)) {
        operations.push({
          op: 'replace',
          path: `/accounts/0/customFields/${escapeJsonPointerSegment(key)}`,
          value,
        });
      }
    }
    for (const id of addContactIds ?? []) {
      operations.push({ op: 'add', path: '/accounts/0/links/contacts/-', value: id });
    }

    if (operations.length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    await nutshellPatch({
      auth: context.auth,
      resourceUri: `/accounts/${companyId}`,
      operations,
    });

    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/accounts/${companyId}`,
    });
    return unwrapFirst(response, 'accounts');
  },
});
