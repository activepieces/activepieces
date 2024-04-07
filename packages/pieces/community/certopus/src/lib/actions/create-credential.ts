import {
  DynamicPropsValue,
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
import { certopusAuth } from '../../';

export const createCredential = createAction({
  auth: certopusAuth,
  name: 'create_credential',
  displayName: 'Create Credential',
  description: 'Create a credential',
  props: {
    organisation: Property.Dropdown<string>({
      displayName: 'Organisations',
      refreshers: [],
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
      refreshers: ['organisation'],
      required: true,
      options: async ({ auth, organisation }) => {
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
      refreshers: ['organisation', 'event'],
      required: true,
      options: async ({ auth, organisation, event }) => {
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
      refreshers: ['organisation', 'event', 'category'],

      props: async ({ auth, organisation, event, category }) => {
        if (!auth) return {};
        if (!organisation) return {};
        if (!event) return {};
        if (!category) return {};

        const fields: DynamicPropsValue = {};
        try {
          const client = makeClient(auth.toString());
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
                description: `Enter data for the ${field.label} field`,
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
});
