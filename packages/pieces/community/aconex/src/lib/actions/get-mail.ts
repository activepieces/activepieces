import { createAction, Property } from '@activepieces/pieces-framework';
import { getMail } from '../api';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';
import { projectIdProp } from '../props';

export const getMailAction = createAction({
  auth: aconexAuth,
  name: 'get_mail',
  displayName: 'Get Mail',
  description:
    'Read one mail item, including MailData. This does not mark the mail as read. MailBody is a write field and is not returned. The body is not renamed.',
  classification: 'READ',
  props: {
    projectId: projectIdProp,
    mailId: Property.ShortText({
      displayName: 'Mail ID',
      description: 'Numeric mail id.',
      required: true,
    }),
  },
  async run(context) {
    return getMail(assertAuthProps(readAuth(context.auth)), context.propsValue.projectId, context.propsValue.mailId);
  },
});
