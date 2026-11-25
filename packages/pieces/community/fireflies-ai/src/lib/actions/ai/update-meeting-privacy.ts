import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps, PRIVACY_VALUES } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const updateMeetingPrivacyAction = createAction({
  auth: firefliesAiAuth,
  name: 'update_meeting_privacy',
  classification: 'WRITE',
  displayName: 'Update Meeting Privacy',
  description: 'Changes who can see a meeting.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets who can see one Fireflies meeting: anyone with the link, only the owner, participants, participating teammates, teammates and participants, or all teammates. Needs the meeting owner or a team admin. Setting the same value again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.updateMeetingPrivacy,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID.' }),
    privacy: Property.StaticDropdown<string>({
      displayName: 'Privacy',
      description: 'Who can see the meeting.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Anyone with the link', value: 'link' },
          { label: 'Only the owner', value: 'owner' },
          { label: 'Participants', value: 'participants' },
          { label: 'Teammates who took part', value: 'participatingteammates' },
          { label: 'Teammates and participants', value: 'teammatesandparticipants' },
          { label: 'All teammates', value: 'teammates' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const privacy = firefliesInput.oneOf({ value: propsValue.privacy, label: 'Privacy', allowed: PRIVACY_VALUES });
    if (privacy === undefined) {
      throw new Error('Privacy is required.');
    }
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.updateMeetingPrivacy({ privacy }),
      variables: { id: meetingId },
      operation: `set the privacy of meeting ${meetingId}`,
    });
    const result = firefliesClient.requireEntity({ data, key: 'updateMeetingPrivacy', notFound: `Fireflies returned no result when changing the privacy of meeting "${meetingId}".` });
    return { id: result['id'] ?? meetingId, title: result['title'] ?? null, privacy: result['privacy'] ?? privacy };
  },
});
