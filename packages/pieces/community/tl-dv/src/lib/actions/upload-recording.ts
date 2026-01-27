import { createAction, Property } from '@activepieces/pieces-framework';
import { tldvAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from '../common/client';

export const uploadRecording = createAction({
  auth: tldvAuth,
  name: 'upload_recording',
  displayName: 'Upload Recording',
  description: 'Import a meeting or recording from a URL',
  props: {
    name: Property.ShortText({
      displayName: 'Meeting Name',
      description: 'The name of the meeting or recording',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Recording URL',
      description: 'Publicly accessible URL of the recording. Supported formats: .mp3, .mp4, .wav, .m4a, .mkv, .mov, .avi, .wma, .flac',
      required: true,
    }),
    happenedAt: Property.DateTime({
      displayName: 'Meeting Date',
      description: 'The date and time when the meeting occurred. If not provided, the current date will be used.',
      required: false,
    }),
    dryRun: Property.Checkbox({
      displayName: 'Dry Run',
      description: 'Test the import without persisting to the database',
      required: false,
      defaultValue: false,
    }),
    participants: Property.Array({
      displayName: 'Participants',
      description: 'Email addresses of meeting participants',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { name, url, happenedAt, dryRun, participants } = context.propsValue;

    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format. Please provide a valid, publicly accessible URL.');
    }

    if (participants && Array.isArray(participants)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const participant of participants) {
        const email = typeof participant === 'string' ? participant : (participant as { email: string }).email;
        if (email && !emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }
    }

    const body: Record<string, any> = {
      name,
      url,
    };

    if (happenedAt) {
      body['happenedAt'] = new Date(happenedAt).toISOString();
    }

    if (dryRun !== undefined) {
      body['dryRun'] = dryRun;
    }

    if (participants && Array.isArray(participants)) {
      body['participants'] = participants.map((p: unknown) => 
        typeof p === 'string' ? p : (p as { email: string }).email
      );
    }

    const response = await tldvCommon.apiCall<{
      success: boolean;
      jobId: string;
      message: string;
    }>({
      method: HttpMethod.POST,
      url: '/v1alpha1/meetings/import',
      auth: { apiKey: context.auth.secret_text },
      body,
    });

    return response;
  },
});

