import { createAction, Property } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from '../common/client';
import { listDropdown } from '../common/props';

type Created = { contact_id: string; existed: boolean; organization_id?: string | null };

export const createOrUpdateContact = createAction({
  auth: arteemisAuth,
  name: 'create_or_update_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Adds a person to Arteemis, or updates them when a contact with the same email or LinkedIn profile already exists.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a person in Arteemis, or update the contact that already has the same email (else the same LinkedIn profile URL), optionally linked to a company, put in a list and given custom fields. Use Find Contact to look a person up without writing. Safe to retry when an email or LinkedIn URL is given; without either, each call creates a new contact.',
    idempotent: false,
  },
  props: {
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description: 'The person\'s full name, e.g. `Claire Martin`.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Work email, e.g. `claire.martin@example.com`. Arteemis uses it (then the LinkedIn profile) to find a contact that already exists.',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'e.g. `https://www.linkedin.com/in/claire-martin`. Needed for the LinkedIn steps of a campaign.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Used by `{{firstName}}` in your messages, e.g. `Claire`. Guessed from the full name when empty.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'e.g. `Martin`.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      description: 'e.g. `Head of Sales`.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'e.g. `+33 6 12 34 56 78`.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company they work for, e.g. `Acme`. Arteemis links the contact to this organization, and creates it when it does not exist yet.',
      required: false,
    }),
    list_id: listDropdown({ required: false, description: 'Optional. The list the contact joins, new or existing.' }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Extra facts you use in your messages or filters, as key and value. Keys use lowercase letters, digits and underscores, e.g. `industry_segment`.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const props = context.propsValue;
    const person = arteemisApi.filled({
      full_name: props.full_name,
      first_name: props.first_name,
      last_name: props.last_name,
      email: props.email,
      linkedin_url: props.linkedin_url,
      role: props.title,
      phone: props.phone,
    });
    const customFields = props.custom_fields && Object.keys(props.custom_fields).length > 0 ? props.custom_fields : undefined;

    // Arteemis matches a person on email first, then LinkedIn profile: create answers the existing contact.
    const { data: created } = await arteemisApi.call<Created>({
      apiKey,
      tool: 'contacts_manage',
      body: {
        operation: 'create',
        contact: {
          kind: 'person',
          ...person,
          ...arteemisApi.filled({ organization_name: props.company }),
          ...(customFields ? { custom_fields: customFields } : {}),
        },
        ...(props.list_id ? { list_id: props.list_id } : {}),
      },
    });

    if (created.existed) {
      await arteemisApi.call({
        apiKey,
        tool: 'contacts_manage',
        body: {
          operation: 'update',
          contact_id: created.contact_id,
          patch: {
            ...person,
            ...(customFields ? { custom_fields: customFields } : {}),
            ...(created.organization_id ? { organization_id: created.organization_id } : {}),
          },
        },
      });
    }

    return {
      id: created.contact_id,
      created: !created.existed,
      updated: created.existed,
      organization_id: created.organization_id ?? null,
      list_id: props.list_id ?? null,
    };
  },
});
