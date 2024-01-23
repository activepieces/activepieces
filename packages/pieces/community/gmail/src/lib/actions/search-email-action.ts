import { createAction } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';

export const gmailSearchMail = createAction({
  auth: gmailAuth,
  name: 'gmail_search_mail',
  description: 'Find for an email in your Gmail account',
  displayName: 'Find Email',
  props: {
    subject: GmailProps.subject,
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category,
  },
  run: async ({ auth, propsValue: { from, to, subject, label, category } }) =>
    await GmailRequests.searchMail({
      access_token: auth.access_token,
      from: from as string,
      to: to as string,
      subject: subject as string,
      label: label as GmailLabel,
      category: category as string,
    }),
});
