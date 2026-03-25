import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../auth';
import { createMailgunClient, MailgunDomainResponse } from '../common/client';

export const createDomainAction = createAction({
  auth: mailgunAuth,
  name: 'create_domain',
  displayName: 'Create Domain',
  description: 'Create a new Mailgun sending domain.',
  props: {
    name: Property.ShortText({
      displayName: 'Domain Name',
      required: true,
    }),
    dkimSelector: Property.ShortText({
      displayName: 'DKIM Selector',
      required: false,
    }),
    wildcard: Property.Checkbox({
      displayName: 'Wildcard',
      required: false,
      defaultValue: false,
    }),
    spamAction: Property.StaticDropdown({
      displayName: 'Spam Action',
      required: false,
      defaultValue: 'disabled',
      options: {
        options: [
          { label: 'Disabled', value: 'disabled' },
          { label: 'Block', value: 'block' },
          { label: 'Tag', value: 'tag' },
        ],
      },
    }),
  },
  async run(context) {
    const client = createMailgunClient(context.auth.props);
    return (await client.domains.create({
      name: context.propsValue.name,
      dkim_selector: context.propsValue.dkimSelector,
      wildcard: context.propsValue.wildcard ? 'true' : 'false',
      spam_action: context.propsValue.spamAction as 'disabled' | 'block' | 'tag' | undefined,
    })) as unknown as MailgunDomainResponse;
  },
});
