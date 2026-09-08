import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';

export const createContactAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a new contact in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a standalone contact record in Sage Intacct. Use this for a contact not tied to a specific customer or vendor record. Each call creates a new contact, so retries duplicate.',
    idempotent: false,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Unique identifier for the contact, e.g. "AMoore". Cannot be changed after creation.',
      required: true,
    }),
    printAs: Property.ShortText({
      displayName: 'Print As',
      description: 'Full name as it should appear on printed documents, e.g. "Andy Moore".',
      required: true,
    }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
    email1: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address, e.g. "andy.moore@example.com".',
      required: false,
    }),
    phone1: Property.ShortText({ displayName: 'Phone', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
  },
  async run(context) {
    const { id, printAs, firstName, lastName, companyName, email1, phone1, status } =
      context.propsValue;
    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: `/objects/${sageIntacctClient.objects.contact}`,
      body: {
        id,
        printAs,
        ...spreadIfDefined('firstName', firstName),
        ...spreadIfDefined('lastName', lastName),
        ...spreadIfDefined('companyName', companyName),
        ...spreadIfDefined('email1', email1),
        ...spreadIfDefined('phone1', phone1),
        ...spreadIfDefined('status', status),
      },
    });
  },
});
