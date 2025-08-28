import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import crypto from 'crypto';
import { z } from 'zod';

type authenticatedParams = {
  apiKey: string;
};

type createCallParams = authenticatedParams & Call;

type meetingDetailParams = authenticatedParams & {
  meetingUuid: string;
};

type Call = {
  additional_details?: string;
  answered?: boolean;
  associations?: {
    object: Array<{
      id: string;
      type: string;
    }>;
    system: string;
  };
  direction: string | null;
  end_at?: string | null;
  external_id: string;
  frm: string | null;
  frm_name?: string;
  is_voicemail?: boolean;
  participants: Array<{
    associations?: {
      object?: Array<{
        id: string;
        type: string;
      }>;
      system?: string;
    };
    email: string;
    name?: string;
  }>;
  recording_url: string | null;
  source: string | null;
  start_at: string | null;
  to: string | null;
  to_name?: string;
  user_email: string;
};

type createCallResponse = {
  additional_details?: string;
  answered?: boolean | string;
  direction?: string;
  end_at?: string;
  external_id: string;
  frm?: string;
  frm_name?: string;
  is_voicemail: boolean;
  meeting: {
    created: string;
    end_at?: string;
    external_id: string;
    id: number;
    is_call: boolean;
    is_disclaimer_added: boolean;
    is_dummy: boolean;
    is_impromptu: boolean;
    is_internal: boolean;
    is_original: boolean;
    is_private: boolean;
    is_split_processed: boolean;
    location?: string;
    meeting_url?: string;
    modified: string;
    org_not_found: boolean;
    organization?: number;
    organizer_email: string;
    original_meeting?: number;
    original_model_counts?: Record<string, unknown>;
    original_org_count: number;
    recurring_master?: number;
    start_at?: string;
    state:
      | 'tentative'
      | 'confirmed'
      | 'cancelled'
      | 'inprogress'
      | 'ended'
      | 'error';
    subject?: string;
    uuid: string;
  };
  organization: {
    created: string;
    domain: string;
    id: number;
    is_marked_for_deletion: boolean;
    modified: string;
    name: string;
    timezone: string;
    uuid: string;
  };
  recording_url?: string;
  source?: string;
  start_at?: string;
  state: string;
  to?: string;
  to_name?: string;
  user_email: string;
};

type meetingRecording = {
  uuid: string;
  meeting_uuid: string;
  audio_url: string;
  video_url: string;
  valid_till: string;
};

type meetingTranscription = {
  meeting_uuid: string;
  speakers: Array<{
    email: string;
    id: number;
    is_rep: boolean;
    name: string;
  }>;
  transcript: Array<{
    speaker_id: number;
    timestamps: number[];
    transcript: string;
  }>;
  transcription_vtt_url: string;
  uuid: string;
};

type newNoteParams = {
  apiKey: string;
  body: unknown;
  headers: Record<string, string>;
};

export const avomaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your API key.',
  required: true,
});

export const avomaCommon = {
  baseURL: 'https://api.avoma.com',
  endpoints: {
    createCall: '/v1/calls/',
    listMeetings: '/v1/meetings/',
    getMeetingRecording: (meetingUuid: string) =>
      `/v1/recordings/?meeting_uuid=${meetingUuid}`,
    getMeetingTranscription: (uuid: string) => `/v1/transcriptions/${uuid}/`,
  },
  // Properties
  createCallProperties: {
    additionalDetails: Property.Json({
      displayName: 'Additional Details',
      description:
        'Additional details of the call. This should be a JSON object.',
      required: false,
    }),
    answered: Property.Checkbox({
      displayName: 'Answered',
      description: 'Whether the call was answered.',
      required: false,
    }),
    associations: Property.Object({
      displayName: 'Associations',
      description: 'Associations related to the call.',
      required: false,
    }),
    direction: Property.ShortText({
      displayName: 'Direction',
      description: 'Direction of the call, e.g. Inbound, Outbound',
      required: true,
    }),
    endAt: Property.DateTime({
      displayName: 'End At',
      description: 'End time of the call.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description:
        'Unique id of the call from the dialer system like hubspot, twilio, zoom, etc.',
      required: true,
    }),
    frm: Property.ShortText({
      displayName: 'From',
      description: 'Phone number from which call was made.',
      required: true,
    }),
    frmName: Property.ShortText({
      displayName: 'From (name)',
      description: 'Name of the caller who made the call.',
      required: false,
    }),
    isVoiceMail: Property.Checkbox({
      displayName: 'Is Voicemail',
      description: 'Indicates if the call is a voicemail.',
      required: false,
      defaultValue: false,
    }),
    participants: Property.Array({
      displayName: 'Participants',
      description: `
        List of participants in the call. First entry should be of the prospect or
        lead with whom the call happened. This will be used in formulating the
        subject of the call in Avoma.`,
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: 'Email of the participant.',
          required: true,
        }),
        name: Property.ShortText({ displayName: 'Name', required: false }),
      },
    }),
    recordingUrl: Property.ShortText({
      displayName: 'Recording URL',
      description: `URL of the recording of the call. This will be used to download the
        recording by avoma for processing, so should be a public URL.`,
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: `Lowercase string indicating the source of the call, e.g. zoom, zoomphone,
        twilio, phoneburner, ringcentral, aircall, etc.`,
      required: false,
    }),
    startAt: Property.DateTime({
      displayName: 'Start at',
      description: 'Start time of the call.',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Phone number to which the call was made.',
      required: true,
    }),
    toName: Property.ShortText({
      displayName: 'To (name)',
      description: 'Name of the person to whom the call was made.',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: `Email of the user who made or received the call.
        This should be an Avoma user's email. License for this user will be used to process
        the call.`,
      required: true,
    }),
  },
  // Schemas
  createCallSchema: {
    additionalDetails: z.record(z.any()).optional(),
    answered: z.boolean().optional(),
    associations: z
      .object({
        object: z
          .array(z.object({ id: z.string(), type: z.string() }))
          .optional(),
        system: z.string().optional(),
      })
      .optional(),
    direction: z.string(),
    endAt: z.string().optional(),
    externalId: z.string(),
    frm: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Invalid phone number. Please provide a number in E.164 format.'
      ),
    frmName: z.string().optional(),
    isVoiceMail: z.boolean().optional(),
    participants: z.array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    ),
    recordingUrl: z.string().optional(),
    source: z.string().optional(),
    startAt: z.string().optional(),
    to: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Invalid phone number. Please provide a number in E.164 format.'
      ),
    toName: z.string().optional(),
    userEmail: z.string().email(),
  },
  // API Methods
  createCall: async ({ apiKey, ...callParams }: createCallParams) => {
    const body: Call = { ...callParams };
    return await httpClient.sendRequest<createCallResponse>({
      method: HttpMethod.POST,
      url: `${avomaCommon.baseURL}${avomaCommon.endpoints.createCall}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: body,
    });
  },
  listMeetings: async ({ apiKey }: authenticatedParams) => {
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${avomaCommon.baseURL}${avomaCommon.endpoints.listMeetings}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  },
  getMeetingRecording: async ({ apiKey, meetingUuid }: meetingDetailParams) => {
    return await httpClient.sendRequest<meetingRecording>({
      method: HttpMethod.GET,
      url: `${avomaCommon.baseURL}${avomaCommon.endpoints.getMeetingRecording(
        meetingUuid
      )}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  },
  getMeetingTranscription: async ({
    apiKey,
    meetingUuid,
  }: meetingDetailParams) => {
    return await httpClient.sendRequest<meetingTranscription>({
      method: HttpMethod.GET,
      url: `${
        avomaCommon.baseURL
      }${avomaCommon.endpoints.getMeetingTranscription(meetingUuid)}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  },
  isWebhookSignatureValid: ({ apiKey, body, headers }: newNoteParams) => {
    const message = `${JSON.stringify(body)}`;
    const hashForVerify = crypto
      .createHmac('sha256', apiKey)
      .update(message)
      .digest('hex');
    const signature = `${hashForVerify}`;
    return headers['x-avoma-signature'] == signature;
  },
};
