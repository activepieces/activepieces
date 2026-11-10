import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { BITE_PRIVACIES, firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries, GraphqlVariableSpec } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const createSoundbiteAction = createAction({
  auth: firefliesAiAuth,
  name: 'create_soundbite',
  classification: 'WRITE',
  displayName: 'Create Soundbite',
  description: 'Creates a soundbite (clip) from part of a meeting.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Fireflies soundbite (a short audio or video clip) from a time range of one meeting, in seconds. Get sentence start/end times from Get Meeting Transcript. Returns the clip ID with status "pending" while it renders. Each call creates a new clip, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.createSoundbite,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID to clip.' }),
    start_time: Property.Number({
      displayName: 'Start Time (Seconds)',
      description: 'Where the clip starts, in seconds from the start of the meeting.',
      required: true,
    }),
    end_time: Property.Number({
      displayName: 'End Time (Seconds)',
      description: 'Where the clip ends, in seconds. Must be after the start.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    media_type: Property.StaticDropdown<string>({
      displayName: 'Media Type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Video', value: 'video' },
          { label: 'Audio', value: 'audio' },
        ],
      },
    }),
    privacies: Property.StaticMultiSelectDropdown<string>({
      displayName: 'Visible To',
      description: 'Who can see the clip. Leave empty for the Fireflies default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Team', value: 'team' },
          { label: 'Participants', value: 'participants' },
        ],
      },
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'Optional description of the clip, up to 500 characters.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const startTime = firefliesInput.optionalSeconds({ value: propsValue.start_time, label: 'Start Time' });
    const endTime = firefliesInput.optionalSeconds({ value: propsValue.end_time, label: 'End Time' });
    if (startTime === undefined || endTime === undefined) {
      throw new Error('Start Time and End Time are required.');
    }
    if (endTime <= startTime) {
      throw new Error('End Time must be after Start Time.');
    }
    const privacies = firefliesInput.allOf({ value: propsValue.privacies, label: 'Visible To', allowed: BITE_PRIVACIES });
    const entries: Array<[GraphqlVariableSpec, unknown]> = [
      [{ variable: 'transcriptId', argument: 'transcript_id', type: 'ID!' }, meetingId],
      [{ variable: 'startTime', argument: 'start_time', type: 'Float!' }, startTime],
      [{ variable: 'endTime', argument: 'end_time', type: 'Float!' }, endTime],
    ];
    const name = firefliesInput.optionalText(propsValue.name);
    if (name !== undefined) {
      entries.push([{ variable: 'name', argument: 'name', type: 'String!' }, name]);
    }
    const mediaType = firefliesInput.oneOf({ value: propsValue.media_type, label: 'Media Type', allowed: ['video', 'audio'] });
    if (mediaType !== undefined) {
      entries.push([{ variable: 'mediaType', argument: 'media_type', type: 'String!' }, mediaType]);
    }
    const summary = firefliesInput.optionalText(propsValue.summary);
    if (summary !== undefined) {
      if (summary.length > 500) {
        throw new Error(`Summary must be at most 500 characters (got ${summary.length}).`);
      }
      entries.push([{ variable: 'summary', argument: 'summary', type: 'String!' }, summary]);
    }
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.createBite({ privacies, variables: entries.map(([spec]) => spec) }),
      variables: Object.fromEntries(entries.map(([spec, value]) => [spec.variable, value])),
      operation: `create a soundbite from meeting ${meetingId}`,
    });
    return firefliesClient.requireEntity({ data, key: 'createBite', notFound: `Fireflies returned no soundbite for meeting "${meetingId}".` });
  },
});
