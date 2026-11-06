import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { getFormDropdownOptions, senjaApiCall } from '../common';
import { sendFormInviteActionOutputSchema } from '../output-schemas';

export const sendFormInviteAction = createAction({
  auth: senjaAuth,
  name: 'send_form_invite',
  classification: 'WRITE',
  displayName: 'Send Form Invite',
  description:
    'Email people an invitation to leave a testimonial through one of your Senja forms.',
  audience: 'both',
  aiMetadata: {
    description:
      "Emails one or more people an invitation to leave a testimonial through a Senja form, using the invite email and follow-up sequence configured on that form in Senja. Requires the form ID (resolve it with List Links) and at least one recipient email (name optional). Recipients Senja has already invited to that form are not emailed again: they come back in skipped with a reason.",
    idempotent: false,
  },
  outputSchema: sendFormInviteActionOutputSchema,
  props: {
    form_id: Property.Dropdown({
      auth: senjaAuth,
      displayName: 'Form',
      description:
        "The Senja form the invite links to. The email content and follow-up reminders come from this form's email sequence settings in Senja.",
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        getFormDropdownOptions({ token: auth?.secret_text }),
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'The people to invite. Add one entry per person.',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: 'Email address the invite is sent to.',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Name',
          description: "The person's name, if you have it.",
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { form_id, recipients } = context.propsValue;

    const validRecipients = recipients
      .map((item) => toRecipient(item))
      .filter((recipient) => recipient !== null);

    if (validRecipients.length === 0) {
      throw new Error('Add at least one recipient with an email address.');
    }

    const response = await senjaApiCall<{
      sent?: number;
      skipped?: { email: string; reason: string }[];
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/invites',
      body: { form_id, recipients: validRecipients },
    });

    const skipped = response.body.skipped ?? [];

    return {
      sent: response.body.sent ?? 0,
      skipped_count: skipped.length,
      skipped,
    };
  },
});

function toRecipient(item: unknown): { email: string; name?: string } | null {
  if (typeof item === 'string') {
    const email = item.trim();
    return email ? { email } : null;
  }
  if (typeof item !== 'object' || item === null) {
    return null;
  }
  const email = 'email' in item && typeof item.email === 'string' ? item.email.trim() : '';
  if (!email) {
    return null;
  }
  const name = 'name' in item && typeof item.name === 'string' ? item.name.trim() : '';
  return name ? { email, name } : { email };
}
