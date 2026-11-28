import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const revokeMeetingAccessAction = createAction({
  auth: firefliesAiAuth,
  name: 'revoke_meeting_access',
  classification: 'DESTRUCTIVE',
  displayName: 'Revoke Meeting Access',
  description: 'Removes shared access to a meeting for one email address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the shared access that Share Meeting gave one email address. Needs the meeting owner or a team admin. Fails with object_not_found when that address has no shared access, including on a repeat call.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.revokeMeetingAccess,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID.' }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to remove.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const [email] = firefliesInput.emailList({ value: firefliesInput.requireText({ value: propsValue.email, label: 'Email' }), label: 'Email', max: 1 });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.revokeSharedMeetingAccess,
      variables: { meetingId, email },
      operation: `revoke ${email}'s access to meeting ${meetingId}`,
    });
    const result = firefliesClient.requireEntity({ data, key: 'revokeSharedMeetingAccess', notFound: `Fireflies returned no result when revoking access to meeting "${meetingId}".` });
    if (result['success'] !== true) {
      const message = firefliesInput.optionalText(result['message']) ?? 'no message returned';
      throw new Error(`Fireflies did not revoke access to meeting "${meetingId}": ${message}`);
    }
    return { success: true, message: result['message'] ?? null, meeting_id: meetingId, email };
  },
});
