import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { subscribe } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const subscribeAction = createAction({
  name: 'subscribe',
  classification: 'WRITE',
  auth: sendyAuth,
  displayName: 'Subscribe',
  description: 'Add a subscriber to a list.',
  audience: 'both',
  aiMetadata: { description: 'Adds a subscriber (by email, plus optional name, country, IP, referrer) to a single Sendy list. Use to opt a contact into one list; for several lists at once use Subscribe Multiple Lists instead. Honors the list\'s double opt-in unless the silent flag forces single opt-in. Effectively an upsert on the email, so re-running with the same email is safe.', idempotent: true },
  props: {
    list: Property.Dropdown({
      auth: sendyAuth,
      displayName: 'List',
      description: 'The list to add the subscriber to.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) =>
        await buildListDropdown(auth as SendyAuthType),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The subscriber's email address.",
      placeholder: 'jane@example.com',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Fills the [Name] tag in your emails.',
      placeholder: 'Jane Doe',
      width: 'half',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code.',
      placeholder: 'US',
      width: 'half',
      required: false,
    }),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      description: "The subscriber's IP address at signup.",
      placeholder: '203.0.113.7',
      width: 'half',
      required: false,
    }),
    referrer: Property.ShortText({
      displayName: 'Signup Page',
      description: 'URL of the page they signed up on.',
      placeholder: 'https://example.com',
      width: 'half',
      required: false,
    }),
    gdpr: Property.Checkbox({
      displayName: 'GDPR Consent',
      description: 'Turn off unless the subscriber gave GDPR-compliant consent.',
      required: false,
      defaultValue: true,
    }),
    silent: Property.Checkbox({
      displayName: 'Skip Double Opt-In',
      description: 'Add them right away, even if the list asks for confirmation.',
      required: false,
      defaultValue: false,
    }),
  },
  propertyGroups: [
    { key: 'subscriber', display: 'section', label: 'Subscriber', icon: 'user', props: ['list', 'email', 'name', 'country'] },
    { key: 'source', display: 'section', label: 'Signup source', icon: 'location', props: ['ipaddress', 'referrer'] },
    { key: 'consent', display: 'section', label: 'Consent', icon: 'tag', props: ['gdpr', 'silent'] },
  ],
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      email: z.string().check(z.email()),
      referrer: z.optional(z.string().check(z.url())),
    });

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
