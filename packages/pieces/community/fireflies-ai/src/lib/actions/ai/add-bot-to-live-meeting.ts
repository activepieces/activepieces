import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput } from '../../common/props';
import { firefliesQueries, GraphqlVariableSpec } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const addBotToLiveMeetingAction = createAction({
  auth: firefliesAiAuth,
  name: 'add_bot_to_live_meeting',
  classification: 'WRITE',
  displayName: 'Add Bot to Live Meeting',
  description: 'Sends the Fireflies bot (Fred) to a meeting that is happening now.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends the Fireflies notetaker bot into a live online meeting (Google Meet, Zoom, Teams) by its link so it records and transcribes it. Limited to 3 calls per 20 minutes per user. Each call sends another join request, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.addBotToLiveMeeting,
  props: {
    meeting_link: Property.ShortText({
      displayName: 'Meeting Link',
      description: 'The https:// join link of the live meeting.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    meeting_password: Property.ShortText({
      displayName: 'Meeting Password',
      description: 'Optional, up to 32 characters.',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (Minutes)',
      description: 'How long the bot stays, 15 to 120 minutes. Default 60.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language Code',
      description: 'Optional meeting language code, for example "en" or "es".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingLink = firefliesInput.requireText({ value: propsValue.meeting_link, label: 'Meeting Link' });
    if (!/^https:\/\/[^\s/]+/i.test(meetingLink)) {
      throw new Error('Meeting Link must be an https:// URL.');
    }
    const meetingPassword = firefliesInput.optionalText(propsValue.meeting_password);
    if (meetingPassword !== undefined && meetingPassword.length > 32) {
      throw new Error('Meeting Password must be at most 32 characters.');
    }
    const duration = firefliesInput.optionalInteger({ value: propsValue.duration, label: 'Duration (Minutes)', min: 15, max: 120 });
    const candidates: Array<[GraphqlVariableSpec, unknown]> = [
      [{ variable: 'meetingLink', argument: 'meeting_link', type: 'String!' }, meetingLink],
      [{ variable: 'title', argument: 'title', type: 'String!' }, firefliesInput.optionalText(propsValue.title)],
      [{ variable: 'meetingPassword', argument: 'meeting_password', type: 'String!' }, meetingPassword],
      [{ variable: 'duration', argument: 'duration', type: 'Int!' }, duration],
      [{ variable: 'language', argument: 'language', type: 'String!' }, firefliesInput.optionalText(propsValue.language)],
    ];
    const entries = candidates.filter(([, value]) => value !== undefined);
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.addToLiveMeeting({ variables: entries.map(([spec]) => spec) }),
      variables: Object.fromEntries(entries.map(([spec, value]) => [spec.variable, value])),
      operation: 'add the bot to a live meeting',
    });
    const result = firefliesClient.requireEntity({ data, key: 'addToLiveMeeting', notFound: 'Fireflies returned no result for the join request.' });
    if (result['success'] !== true) {
      throw new Error('Fireflies did not accept the join request (success was false).');
    }
    return { success: true, meeting_link: meetingLink };
  },
});
