import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { subscribe } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const subscribeAction = createAction({
  name: 'subscribe',
  auth: sendyAuth,
  displayName: 'Subscribe Updated',
  description: 'Add a new subscriber to a list',
  props: {
    list: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to subscribe to',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) =>
        await buildListDropdown(auth as SendyAuthType),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The user's email",
      required: true,
      validators: [Validators.email],
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: "The user's name",
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: "The user's 2 letter country code",
      required: false,
    }),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      description: "The user's IP address",
      required: false,
    }),
    referrer: Property.ShortText({
      displayName: 'Referrer',
      description: 'The URL where the user signed up from',
      required: false,
      validators: [Validators.url],
    }),
    gdpr: Property.Checkbox({
      displayName: 'GDPR compliant',
      description:
        "If you're signing up EU users in a GDPR compliant manner, set to true",
      required: false,
      defaultValue: true,
    }),
    silent: Property.Checkbox({
      displayName: 'Silent',
      description:
        "set to true if your list is 'Double opt-in' but you want to bypass that and signup the user to the list as 'Single Opt-in instead' ",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return await subscribe(context.auth, {
      list: context.propsValue.list,
      email: context.propsValue.email,
      name: context.propsValue.name,
      country: context.propsValue.country,
      ipaddress: context.propsValue.ipaddress,
      referrer: context.propsValue.referrer,
      gdpr: context.propsValue.gdpr,
      silent: context.propsValue.silent,
    });
  },
});
