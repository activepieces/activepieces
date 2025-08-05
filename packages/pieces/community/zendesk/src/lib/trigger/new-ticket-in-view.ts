import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const newTicketInView = createTrigger({
  auth: zendeskAuth,
  name: 'new_ticket_in_view',
  displayName: 'New ticket in view',
  description: 'Triggers when a new ticket is created in a view',
  type: TriggerStrategy.POLLING,
  props: {
    view_id: Property.Dropdown({
      displayName: 'View',
      description: 'The view to monitor for new tickets',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        const authentication = auth as AuthProps;
        if (
          !authentication?.['email'] ||
          !authentication?.['subdomain'] ||
          !authentication?.['token']
        ) {
          return {
            placeholder: 'Fill your authentication first',
            disabled: true,
            options: [],
          };
        }
        const response = await httpClient.sendRequest<{ views: Array<{ id: number; title: string }> }>({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/views.json`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });
        return {
          placeholder: 'Select a view',
          options: response.body.views.map((view: { id: number; title: string }) => ({
            label: view.title,
                          value: view.id.toString(),
          })),
        };
      },
    }),
  },
  sampleData: undefined,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

const polling: Polling<AuthProps, { view_id: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const items = await getTickets(auth, propsValue.view_id);
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

async function getTickets(authentication: AuthProps, view_id: string) {
  const { email, token, subdomain } = authentication;
  const response = await httpClient.sendRequest<{ tickets: Array<{ id: number; [key: string]: unknown }> }>({
    url: `https://${subdomain}.zendesk.com/api/v2/views/${view_id}/tickets.json?sort_order=desc&sort_by=created_at&per_page=200`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  return response.body.tickets;
}
