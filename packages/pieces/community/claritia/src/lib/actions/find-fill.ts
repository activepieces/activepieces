import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { claritiaAuth } from '../auth';
import { claritiaCall } from '../common';
import { formDropdown } from '../props';

export const findFill = createAction({
  auth: claritiaAuth,
  name: 'find_fill',
  displayName: 'Find Fill',
  description: 'Finds the latest fill from an email.',
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    form: formDropdown,
  },
  async run(context) {
    const r = await claritiaCall<{ items: object[] }>(context.auth, HttpMethod.GET, '/events', undefined, {
      event: 'form.submitted',
      email: context.propsValue.email,
      form: context.propsValue.form ?? '',
      limit: '1',
    });
    return r.items;
  },
});
