import {
  DynamicPropsValue,
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';

import { certopusCommon, makeClient } from '../common';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Organisation } from '../common/models/oranisation';
import { Event } from '../common/models/event';
import { Category } from '../common/models/category';
import { RecipientField } from '../common/models/recipient-field';
import { certopusAuth } from '../auth';

export const createCredential = createAction({
  auth: certopusAuth,
  name: 'create_credential',
  classification: 'WRITE',
  displayName: 'Create Credential',
  description: 'Create a credential',
  audience: 'both',
  aiMetadata: {
    description: 'Issues a Certopus certificate/credential for a single recipient under a given organisation, event, and category, supplying the recipient email plus the category-specific data fields. Use to grant a certificate to one person; the generate and publish flags control whether Certopus immediately produces and publishes it. Not idempotent — each call creates a new credential, so repeating it issues duplicates.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'credential',
      display: 'section',
      label: 'Credential',
      icon: 'tag',
      props: ['organisation', 'event', 'category'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Recipient',
      icon: 'user',
      props: ['email', 'fields'],
    },
    {
      key: 'options',
      display: 'section',
      label: 'Options',
      icon: 'sliders',
      props: ['generate', 'publish', 'options_info'],
    },
  ],
  props: {
    organisation: Property.Dropdown({
      auth: certopusAuth,
      displayName: 'Organisation',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const client = makeClient(auth.secret_text);
        const res = await client.listOrganisations();

        return {
          disabled: false,
          options: res.map((x: Organisation) => ({
            label: x.name,
            value: x.id,
          })),
        };
      },
    }),
    event: Property.Dropdown({
      auth: certopusAuth,
      displayName: 'Event',
      refreshers: ['organisation'],
      required: true,
      options: async ({ auth, organisation }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        if (!organisation) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an organisation first.',
          };
        }
        const client = makeClient(auth.secret_text);
        const res = await client.listEvents(organisation as string);

        return {
          disabled: false,
          options: res.map((x: Event) => ({
            label: x.title,
            value: x.id,
          })),
        };
      },
    }),
    category: Property.Dropdown({
      auth: certopusAuth,
      displayName: 'Category',
      description: 'Decides which recipient fields appear below.',
      refreshers: ['organisation', 'event'],
      required: true,
      options: async ({ auth, organisation, event }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        if (!organisation) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an organisation first.',
          };
        }
        if (!event) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an event first.',
          };
        }
        const client = makeClient(auth.secret_text);
        const res = await client.listCategories(
          organisation as string,
          event as string
        );

        return {
          disabled: false,
          options: res.map((x: Category) => ({
            label: x.title,
            value: x.id,
          })),
        };
      },
    }),
    generate: Property.Checkbox({
      displayName: 'Generate',
      description: 'Produce the credential in Certopus right away.',
      defaultValue: false,
      required: false,
      width: 'half',
    }),
    publish: Property.Checkbox({
      displayName: 'Publish',
      description: 'Make it available to the recipient right away.',
      defaultValue: false,
      required: false,
      width: 'half',
    }),
    options_info: Property.MarkDown({
      value: 'If either is off, you finish that step by hand in Certopus.',
      variant: MarkdownVariant.INFO,
    }),
    email: Property.ShortText({
      displayName: 'Recipient Email',
      placeholder: 'name@example.com',
      required: true,
    }),
    fields: Property.DynamicProperties({
      auth: certopusAuth,
      displayName: 'Recipient Data',
      required: true,
      refreshers: ['organisation', 'event', 'category'],

      props: async ({ auth, organisation, event, category }) => {
        if (!auth) return {};
        if (!organisation) return {};
        if (!event) return {};
        if (!category) return {};

        const fields: DynamicPropsValue = {};
        try {
          const client = makeClient(auth.secret_text);
          const recipientFields: RecipientField[] =
            await client.listRecipientFields(
              organisation.toString(),
              event.toString(),
              category.toString()
            );
          recipientFields.forEach((field: RecipientField) => {
            if (field.key !== 'email') {
              const params = {
                displayName: field.label,
                required: true,
              };
              fields[field.key] = Property.ShortText(params);
            }
          });
        } catch (e) {
          console.debug(e);
        }

        return fields;
      },
    }),
  },
  async run(context) {
    const { organisation, event, category, publish, generate, email, fields } =
      context.propsValue;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${certopusCommon.baseUrl}/certificates`,
      body: {
        organisationId: organisation,
        eventId: event,
        categoryId: category,
        publish: publish ?? false,
        generate: generate ?? false,
        recipients: [
          {
            email: email,
            data: fields,
          },
        ],
      },
      headers: {
        'x-api-key': context.auth.secret_text,
      },
      queryParams: {},
    };
    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
