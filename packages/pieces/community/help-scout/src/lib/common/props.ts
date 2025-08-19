import {
  DynamicPropsValue,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from './api';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerIdDropdown = Property.Dropdown({
  displayName: 'Customer',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: false,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/customers',
      auth: auth as OAuth2PropertyValue,
    });

    const { _embedded } = response.body as {
      _embedded: {
        customers: { id: number; firstName: string; lastName: string }[];
      };
    };

    return {
      disabled: false,
      options: _embedded.customers.map((customer) => {
        return {
          label: `${customer.firstName} ${customer.lastName}`,
          value: customer.id.toString(),
        };
      }),
    };
  },
});

export const userIdDropdown =(displayName:string)=> Property.Dropdown({
  displayName,
  refreshers: [],
  required: false,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: false,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/users',
      auth: auth as OAuth2PropertyValue,
    });

    const { _embedded } = response.body as {
      _embedded: {
        users: { id: number; firstName: string; lastName: string }[];
      };
    };

    return {
      disabled: false,
      options: _embedded.users.map((user) => {
        return {
          label: `${user.firstName ?? ""} ${user.lastName ?? ""}` || user.id.toString(),
          value: user.id.toString(),
        };
      }),
    };
  },
});


export const conversationIdDropdown = Property.Dropdown({
  displayName:'Conversation',
  refreshers: [],
  required: false,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: false,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/conversations',
      auth: auth as OAuth2PropertyValue,
    });

    const { _embedded } = response.body as {
      _embedded: {
        conversations: { id: number; subject: string,primaryCustomer:{email:string} }[];
      };
    };

    return {
      disabled: false,
      options: _embedded.conversations.map((convo) => {
        return {
          label: `${convo.subject} - ${convo.primaryCustomer.email}`,
          value: convo.id.toString(),
        };
      }),
    };
  },
});



export const mailboxIdDropdown =(required=true)=> Property.Dropdown({
  displayName: 'Mailbox',
  refreshers: [],
  required,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: false,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/mailboxes ',
      auth: auth as OAuth2PropertyValue,
    });

    const { _embedded } = response.body as {
      _embedded: {
        mailboxes : { id: number; name: string }[];
      };
    };

    return {
      disabled: false,
      options: _embedded.mailboxes .map((mailbox) => {
        return {
          label: mailbox.name,
          value: mailbox.id.toString(),
        };
      }),
    };
  },
});

export const customerProperties = Property.DynamicProperties({
  displayName: 'Customer Properties',
  refreshers: [],
  required: true,
  props: async ({ auth }) => {
    if (!auth) return {};

    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/customer-properties',
      auth: auth as OAuth2PropertyValue,
    });

    const { _embedded } = response.body as {
      _embedded: {
        'customer-properties': {
          type: string;
          slug: string;
          name: string;
          options: { id: string; label: string }[];
        }[];
      };
    };

    const props: DynamicPropsValue = {};

    for (const field of _embedded['customer-properties']) {
      switch (field.type) {
        case 'text':
        case 'url':
          props[field.slug] = Property.ShortText({
            displayName: field.name,
            required: false,
          });
          break;
        case 'number':
          props[field.slug] = Property.Number({
            displayName: field.name,
            required: false,
          });
          break;
        case 'date':
          props[field.slug] = Property.ShortText({
            displayName: field.name,
            description: 'Provide date in YYYY-MM-DD format.',
            required: false,
          });
          break;
        case 'dropdown':
          props[field.slug] = Property.StaticDropdown({
            displayName: field.name,
            required: false,
            options: {
              disabled: false,
              options: field.options.map((option) => ({
                label: option.label,
                value: option.label,
              })),
            },
          });
      }
    }

    return props;
  },
});
