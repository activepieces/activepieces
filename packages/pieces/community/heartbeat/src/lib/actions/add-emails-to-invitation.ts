import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const addEmailsToInvitationAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_add_emails_to_invitation',
  classification: 'WRITE',
  displayName: 'Invite Emails to Invitation Link',
  description: 'Lets these emails join through an invitation link, optionally emailing them the invitation.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds emails to an invitation link so those people can sign up with its role and groups; when Send Invitation Email is Yes, Heartbeat emails each of them an invitation. Get the ID from List Invitation Links. Not idempotent when emails are sent: repeating sends them again.',
    idempotent: false,
  },
  props: {
    invitationId: heartbeatProps.id({ displayName: 'Invitation Link ID', description: 'Use List Invitation Links to find the ID.', required: true }),
    emails: heartbeatProps.emails({ displayName: 'Emails', description: '1-100 email addresses.', required: true }),
    sendEmail: Property.StaticDropdown({
      displayName: 'Send Invitation Email',
      description: 'Yes emails each person an invitation now. No only allows them to sign up through the link.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Yes, email the invitation', value: 'yes' },
          { label: 'No, do not email', value: 'no' },
        ],
      },
    }),
  },
  outputSchema: heartbeatOutputSchemas.invitationEmails,
  async run({ auth, propsValue }) {
    const invitationId = heartbeatApi.uuid({ value: propsValue.invitationId, label: 'Invitation Link ID' });
    const emails = heartbeatApi.emailList({ value: propsValue.emails, label: 'Emails', min: 1 });
    const shouldSendEmail = heartbeatApi.triState(propsValue.sendEmail);
    if (shouldSendEmail === undefined) {
      throw new Error('Send Invitation Email must be yes or no.');
    }
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: `/invitations/${invitationId}`,
      operation: 'add emails to invitation link',
      body: { emails, shouldSendEmail },
    });
    return { invitationId, emails, emailSent: shouldSendEmail };
  },
});
