import { PieceAuth, Property } from '@activepieces/pieces-framework';
import Retell from 'retell-sdk';
import { z } from 'zod';

type authParams = { apiKey: string };

interface createPhoneCallParams extends authParams {
  fromNumber: string;
  toNumber: string;
  overrideAgentId?: string;
  overrideAgentVersion?: number;
  metadata?: unknown;
  customSIPHeaders?: { [key: string]: string };
  retellLLMDynamicVariables?: { [key: string]: string };
}

interface getCallParams extends authParams {
  callId: string;
}

interface createPhoneNumberParams extends authParams {
  areaCode?: number;
  countryCode?: 'US' | 'CA';
  inboundAgentId?: string;
  inboundAgentVersion?: number;
  inboundWebhookUrl?: string;
  nickname?: string;
  numberProvider?: 'twilio' | 'telnyx';
  outboundAgentId?: string;
  outboundAgentVersion?: number;
  phoneNumber?: string;
  toolFree?: boolean;
}

interface getPhoneNumberParams extends authParams {
  phoneNumber: string;
}

interface getVoiceParams extends authParams {
  voiceId: string;
}

interface getAgentParams extends authParams {
  agentId: string;
  agentVersion?: number;
}

export const retellAiAuth = PieceAuth.SecretText({
  displayName: 'Retell AI API Key',
  description: 'Enter your API key for Retell AI.',
  required: true,
});

export const retellCommon = {
  baseUrl: 'https://api.retell.ai',
  // Properties
  newPhoneCallProperties: {
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description:
        'The number you own in E.164 format. Must be a number purchased \
        from Retell or imported to Retell.',
      required: true,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description:
        'The number you want to call, in E.164 format. If using a \
        number purchased from Retell, only US numbers are supported as destination.',
      required: true,
    }),
    overrideAgentId: Property.ShortText({
      displayName: 'Override Agent ID',
      description:
        'For this particular call, override the agent used with this agent id.\
        This does not bind the agent to this number, this is for one time override.',
      required: false,
    }),
    overrideAgentVersion: Property.Number({
      displayName: 'Override Agent Version',
      description:
        'For this particular call, override the agent version used with this \
        version. This does not bind the agent version to this number, this is for one \
        time override.',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'An arbitrary object for storage purpose only. You can put anything \
        here like your internal customer id associated with the call. Not used for \
        processing. You can later get this field from the call object.',
      required: false,
    }),
    customSIPHeaders: Property.Object({
      displayName: 'Custom SIP Headers',
      description: 'Add optional custom SIP headers to the call.',
      required: false,
    }),
    retellLLMDynamicVariables: Property.Object({
      displayName: 'Retell LLM Dynamic Variables',
      description:
        'Add optional dynamic variables in key value pairs of string that \
        injects into your Response Engine prompt and tool description. Only \
        applicable for Response Engine.',
      required: false,
    }),
  },

  newPhoneNumberProperties: {
    areaCode: Property.Number({
      displayName: 'Area Code',
      description:
        'Area code of the number to obtain. Format is a 3 digit integer. \
        Currently only supports US area code.',
      required: false,
    }),
    countryCode: Property.StaticDropdown({
      displayName: 'Country Code',
      description:
        'The ISO 3166-1 alpha-2 country code of the number you are trying \
        to purchase. If left empty, will default to "US".',
      required: false,
      defaultValue: 'US',
      options: {
        options: [
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
        ],
      },
    }),
    inboundAgentId: Property.ShortText({
      displayName: 'Inbound Agent ID',
      description:
        'Unique id of agent to bind to the number. The number will automatically \
        use the agent when receiving inbound calls. If null, this number would not \
        accept inbound call.',
      required: false,
    }),
    inboundAgentVersion: Property.Number({
      displayName: 'Inbound Agent Version',
      description:
        'Version of the inbound agent to bind to the number. If not provided, will \
        default to latest version.',
      required: false,
    }),
    inboundWebhookUrl: Property.ShortText({
      displayName: 'Inbound Webhook URL',
      description:
        'If set, will send a webhook for inbound calls, where you can to override \
        agent id, set dynamic variables and other fields specific to that call.',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'Nickname of the number. This is for your reference only.',
      required: false,
    }),
    numberProvider: Property.StaticDropdown({
      displayName: 'Number Provider',
      description:
        'The provider to purchase the phone number from. Default to twilio.',
      required: false,
      defaultValue: 'twilio',
      options: {
        options: [
          { label: 'Twilio', value: 'twilio' },
          { label: 'Telnyx', value: 'telnyx' },
        ],
      },
    }),
    outboundAgentId: Property.ShortText({
      displayName: 'Outbound Agent ID',
      description:
        'Unique id of agent to bind to the number. The number will automatically \
        use the agent when conducting outbound calls. If null, this number would \
        not be able to initiate outbound call without agent id override.',
      required: false,
    }),
    outboundAgentVersion: Property.Number({
      displayName: 'Outbound Agent Version',
      description:
        'Version of the outbound agent to bind to the number. If not provided, \
        will default to latest version.',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The number you are trying to purchase in E.164 format of the number \
        (+country code then number with no space and no special characters).',
      required: false,
    }),
    toolFree: Property.Checkbox({
      displayName: 'Toll Free',
      description:
        'Whether to purchase a toll-free number. \
        Toll-free numbers incur higher costs.',
      required: false,
    }),
  },

  getCallProperties: () => ({
    callId: Property.Dropdown({
      displayName: 'Call ID',
      description: 'Unique identifier for the call.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const calls = await retellCommon.listCalls({
          apiKey: auth as string,
        });
        return {
          options: calls.map((call) => ({
            label: call.call_id,
            value: call.call_id,
          })),
        };
      },
    }),
  }),

  getPhoneNumberProperties: () => ({
    phoneNumber: Property.Dropdown({
      displayName: 'Phone Number',
      description: 'A number you own.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const phoneNumbers = await retellCommon.listPhoneNumbers({
          apiKey: auth as string,
        });
        return {
          options: phoneNumbers.map((number) => ({
            label: number.nickname ?? number.phone_number,
            value: number.phone_number,
          })),
        };
      },
    }),
  }),

  getVoiceProperties: () => ({
    voiceId: Property.Dropdown({
      displayName: 'Voice',
      description: 'The voice you want to retrieve.',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const voices = await retellCommon.listVoices({
          apiKey: auth as string,
        });
        return {
          options: voices.map((voice) => ({
            label: voice.voice_name ?? voice.voice_id,
            value: voice.voice_id,
          })),
        };
      },
    }),
  }),

  getAgentProperties: () => ({
    agentId: Property.Dropdown({
      displayName: 'Agent',
      description: 'The agent you want to retrieve.',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const agents = await retellCommon.listAgents({
          apiKey: auth as string,
        });
        return {
          options: agents.map((agent) => ({
            label: agent.agent_name ?? agent.agent_id,
            value: agent.agent_id,
          })),
        };
      },
    }),
    agentVersion: Property.Number({
      displayName: 'Agent Version',
      description:
        'The version of the agent you want to retrieve. \
        Defaults to the last version.',
      required: false,
    }),
  }),

  // Zod Validation Schemas
  newPhoneCallSchema: {
    fromNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Invalid phone number. Please provide a number in E.164 format.'
      ),
    toNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Invalid phone number. Please provide a number in E.164 format.'
      ),
    overrideAgentId: z.string().optional(),
    overrideAgentVersion: z.number().optional(),
    metadata: z.object({}).optional(),
    customSIPHeaders: z.object({}).optional(),
    retellLLMDynamicVariables: z.object({}).optional(),
  },

  newPhoneNumberSchema: {
    areaCode: z
      .number()
      .int()
      .min(100, 'Area code must be a 3 digit integer.')
      .max(999, 'Area code must be a 3 digit integer.')
      .optional(),
    countryCode: z.enum(['US', 'CA']).optional(),
    inboundAgentId: z.string().optional(),
    inboundAgentVersion: z.number().optional(),
    inboundWebhookUrl: z.string().url('Invalid URL format').optional(),
    nickname: z.string().optional(),
    numberProvider: z.enum(['twilio', 'telnyx']).optional(),
    outboundAgentId: z.string().optional(),
    outboundAgentVersion: z.number().optional(),
    phoneNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Invalid phone number. Please provide a number in E.164 format.'
      )
      .optional(),
    toolFree: z.boolean().optional(),
  },

  getPhoneNumberSchema: {
    phoneNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Invalid phone number. Please provide a number in E.164 format.'
      ),
  },

  // API Calls
  createPhoneCall: ({ apiKey, ...phoneProps }: createPhoneCallParams) => {
    const client = new Retell({ apiKey });

    const body = {
      from_number: phoneProps.fromNumber,
      to_number: phoneProps.toNumber,
      override_agent_id: phoneProps.overrideAgentId,
      override_agent_version: phoneProps.overrideAgentVersion,
      metadata: phoneProps.metadata,
      custom_sip_headers: phoneProps.customSIPHeaders,
      retell_llm_dynamic_variables: phoneProps.retellLLMDynamicVariables,
    };

    return client.call.createPhoneCall(body);
  },

  createPhoneNumber: ({
    apiKey,
    ...phoneNumberProps
  }: createPhoneNumberParams) => {
    const client = new Retell({ apiKey });

    const body = {
      area_code: phoneNumberProps.areaCode,
      country_code: phoneNumberProps.countryCode,
      inbound_agent_id: phoneNumberProps.inboundAgentId,
      inbound_agent_version: phoneNumberProps.inboundAgentVersion,
      inbound_webhook_url: phoneNumberProps.inboundWebhookUrl,
      nickname: phoneNumberProps.nickname,
      number_provider: phoneNumberProps.numberProvider,
      outbound_agent_id: phoneNumberProps.outboundAgentId,
      outbound_agent_version: phoneNumberProps.outboundAgentVersion,
      phone_number: phoneNumberProps.phoneNumber,
      toll_free: phoneNumberProps.toolFree,
    };

    return client.phoneNumber.create(body);
  },

  getCall: ({ apiKey, callId }: getCallParams) => {
    const client = new Retell({ apiKey });
    return client.call.retrieve(callId);
  },

  listCalls: ({ apiKey }: authParams) => {
    const client = new Retell({ apiKey });
    return client.call.list({});
  },

  getPhoneNumber: ({ apiKey, phoneNumber }: getPhoneNumberParams) => {
    const client = new Retell({ apiKey });
    return client.phoneNumber.retrieve(phoneNumber);
  },

  listPhoneNumbers: ({ apiKey }: authParams) => {
    const client = new Retell({ apiKey });
    return client.phoneNumber.list();
  },

  getVoice: ({ apiKey, voiceId }: getVoiceParams) => {
    const client = new Retell({ apiKey });
    return client.voice.retrieve(voiceId);
  },

  listVoices: ({ apiKey }: authParams) => {
    const client = new Retell({ apiKey });
    return client.voice.list();
  },

  getAgent: ({ apiKey, agentId, agentVersion }: getAgentParams) => {
    const client = new Retell({ apiKey });
    return client.agent.retrieve(
      agentId,
      agentVersion ? { version: agentVersion } : undefined
    );
  },

  listAgents: ({ apiKey }: authParams) => {
    const client = new Retell({ apiKey });
    return client.agent.list();
  },
};
