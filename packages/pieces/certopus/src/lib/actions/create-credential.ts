import {
  DynamicPropsValue,
  Property,
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
import { certopus } from '../../';

export const createCredential = certopus.addAction({
  name: 'create_credential',
  displayName: 'Create Credential',
  description: 'Create a credential',
  props: {
    organisation: Property.Dropdown<string>({
      displayName: 'Organisations',
      refreshers: ['authentication'],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.',
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listOrganisations();
        console.log(res);

        return {
          disabled: false,
          options: res.map((x: Organisation) => ({
            label: x.name,
            value: x.id,
          })),
        };
      },
    }),
    event: Property.Dropdown<string>({
      displayName: 'Event',
      refreshers: ['authentication', 'organisation'],
      required: true,
      options: async ({ auth, propsValue }) => {
        const { organisation } = propsValue
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.',
          };
        }
        if (!organisation) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an organisation first.',
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listEvents(organisation as string);
        console.log(res);

        return {
          disabled: false,
          options: res.map((x: Event) => ({
            label: x.title,
            value: x.id,
          })),
        };
      },
    }),
    category: Property.Dropdown<string>({
      displayName: 'Category',
      refreshers: ['authentication', 'organisation', 'event'],
      required: true,
      options: async ({ auth, propsValue }) => {
        const { organisation, event } = propsValue
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.',
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
        const client = makeClient(auth as string);
        const res = await client.listCategories(
          organisation as string,
          event as string
        );
        console.log(res);

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
      description: 'Automatically generate the crentials',
      defaultValue: false,
      required: true,
    }),
    publish: Property.Checkbox({
      displayName: 'Publish',
      description: 'Automatically publish the crentials',
      defaultValue: false,
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Recipient Email',
      description: 'Email address of the recipient',
      required: true,
    }),
    fields: Property.DynamicProperties({
      displayName: 'Recipient Data',
      required: true,
      refreshers: ['authentication', 'organisation', 'event', 'category'],

      props: async ({ authentication, organisation, event, category }) => {
        if (!authentication) return {};
        if (!organisation) return {};
        if (!event) return {};
        if (!category) return {};

        const fields: DynamicPropsValue = {};
        try {
          const client = makeClient(authentication.toString());
          const recipientFields: RecipientField[] =
            await client.listRecipientFields(
              organisation.toString(),
              event.toString(),
              category.toString()
            );
          recipientFields.forEach((field: RecipientField) => {
            //skil email field as it already included
            if (field.key !== 'email') {
              const params = {
                displayName: field.label,
                description: `Eneter data for the ${field.label} field`,
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
        publish: publish,
        generate: generate,
        recipients: [
          {
            email: email,
            data: fields,
          },
        ],
      },
      headers: {
        'x-api-key': context.auth,
      },
      queryParams: {},
    };
    const res = await httpClient.sendRequest(request);
    return res.body;
  },
  sampleData: {
    message: 'success',
    responses: [
      {
        certificateId: 'String',
        recipient: {
          id: 'String',
          email: 'String',
          data: 'Object',
        },
        category: {
          id: 'String',
          name: 'String',
        },
        eventName: 'String',
        pdfUrl: 'String',
        imageUrl: 'String',
        certificateUrl: 'String',
        issueDate: 'String',
        expiryDate: 'String',
        walletId: 'String',
      },
    ],
  },
});
