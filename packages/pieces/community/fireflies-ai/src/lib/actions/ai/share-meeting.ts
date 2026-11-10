import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const shareMeetingAction = createAction({
  auth: firefliesAiAuth,
  name: 'share_meeting',
  classification: 'WRITE',
  displayName: 'Share Meeting',
  description: 'Shares a meeting with people by email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Shares one Fireflies meeting with up to 50 email addresses, who get an email invite. Needs the meeting owner or a team admin; limited to 60 shares per hour. Fails if Fireflies refuses, for example when an address already has access. Undo with Revoke Meeting Access.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.shareMeeting,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID to share.' }),
    emails: Property.Array({
      displayName: 'Emails',
      description: '1 to 50 email addresses to share with.',
      required: true,
    }),
    expiry_days: Property.Number({
      displayName: 'Expires After (Days)',
      description: 'Optional. Days until the shared access expires. Leave empty for no expiry.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const emails = firefliesInput.emailList({ value: propsValue.emails, label: 'Emails', max: 50 });
    if (emails.length === 0) {
      throw new Error('Emails needs at least one email address.');
    }
    const expiryDays = firefliesInput.optionalInteger({ value: propsValue.expiry_days, label: 'Expires After (Days)', min: 1, max: 365 });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.shareMeeting({ withExpiry: expiryDays !== undefined }),
      variables: expiryDays === undefined ? { meetingId, emails } : { meetingId, emails, expiryDays },
      operation: `share meeting ${meetingId}`,
    });
    const result = firefliesClient.requireEntity({ data, key: 'shareMeeting', notFound: `Fireflies returned no result when sharing meeting "${meetingId}".` });
    if (result['success'] !== true) {
      const message = firefliesInput.optionalText(result['message']) ?? 'no message returned';
      throw new Error(`Fireflies did not share meeting "${meetingId}": ${message}`);
    }
    return {
      success: true,
      message: result['message'] ?? null,
      share_slug: result['share_slug'] ?? null,
      meeting_id: meetingId,
      emails,
    };
  },
});
