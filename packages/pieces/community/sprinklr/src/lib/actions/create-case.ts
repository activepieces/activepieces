import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase, SprinklrCaseOutput } from '../common/case';
import { sprinklrCaseWrite } from '../common/case-write';
import { sprinklrClient, SprinklrAuthValue } from '../common/client';
import { sprinklrEndpoints } from '../common/endpoints';
import { sprinklrErrors } from '../common/errors';

const CHANNELS = ['EMAIL', 'SMS'] as const;

type Channel = (typeof CHANNELS)[number];

function parseChannel(value: unknown): Channel {
  const upper = typeof value === 'string' ? value.trim().toUpperCase() : '';
  const channel = CHANNELS.find((item) => item === upper);
  if (!channel) {
    throw new Error(`Channel must be Email or SMS, but it was "${String(value ?? '')}". Pick Email or SMS.`);
  }
  return channel;
}

function contactInfo({ channel, contact, fullName }: { channel: Channel; contact: unknown; fullName: unknown }): Record<string, unknown> {
  const value = sprinklrCaseWrite.cleanText(contact);
  const name = sprinklrCaseWrite.cleanText(fullName);
  if (channel === 'EMAIL') {
    if (!value) {
      throw new Error("Contact is required. With Channel Email, enter the customer's email address.");
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(value)) {
      throw new Error(`Contact "${value}" is not an email address. With Channel Email, enter the customer's email address.`);
    }
    return sprinklrCaseWrite.compact({ email: value, fullName: name });
  }
  if (!value) {
    throw new Error("Contact is required. With Channel SMS, enter the customer's phone number.");
  }
  if (!/^\+?[0-9][0-9 ()-]{4,}$/.test(value)) {
    throw new Error(`Contact "${value}" is not a phone number. With Channel SMS, enter the phone number with its country code.`);
  }
  return sprinklrCaseWrite.compact({ phoneNo: value, fullName: name });
}

function workflow({ customFields, queueId }: { customFields: unknown; queueId: unknown }): Record<string, unknown> | undefined {
  const customProperties = sprinklrCaseWrite.customFieldsAsLists(customFields);
  const queue = sprinklrCaseWrite.cleanText(queueId);
  const queues = queue === undefined ? undefined : [{ queueId: sprinklrCaseWrite.parseId({ value: queue, field: 'Queue ID' }) }];
  const result = sprinklrCaseWrite.compact({ customProperties, queues });
  return Object.keys(result).length > 0 ? result : undefined;
}

function buildBody(props: CreateCaseInput): Record<string, unknown> {
  const channel = parseChannel(props.channel);
  const comment = sprinklrCaseWrite.cleanText(props.first_comment);
  return sprinklrCaseWrite.compact({
    subject: sprinklrCaseWrite.cleanText(props.subject),
    description: sprinklrCaseWrite.cleanText(props.description),
    channelType: channel,
    contactInfo: contactInfo({ channel, contact: props.contact, fullName: props.contact_name }),
    priority: sprinklrCaseWrite.cleanText(props.priority),
    caseType: sprinklrCaseWrite.cleanText(props.case_type),
    workflow: workflow({ customFields: props.custom_fields, queueId: props.queue_id }),
    commentDTO: comment === undefined ? undefined : { comment },
  });
}

function returnedCase(data: unknown): Record<string, unknown> {
  const first = Array.isArray(data) ? data[0] : data;
  if (sprinklrErrors.isRecord(first)) {
    return first;
  }
  if (typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(first.trim()))) {
    return { caseNumber: first };
  }
  if (typeof first === 'string' && first.trim().length > 0) {
    return { id: first.trim() };
  }
  return {};
}

function isFullCase(item: Record<string, unknown>): boolean {
  return ['subject', 'createdTime', 'contact', 'workflow'].some((key) => key in item);
}

async function readBack({ auth, created, body }: { auth: SprinklrAuthValue; created: Record<string, unknown>; body: Record<string, unknown> }): Promise<SprinklrCaseOutput> {
  const partial = sprinklrCase.normalize({ ...body, ...created });
  try {
    if (partial.caseNumber !== null) {
      return await sprinklrCase.getByNumber({ auth, caseNumber: partial.caseNumber });
    }
    if (partial.id !== null) {
      return await sprinklrCase.getById({ auth, id: partial.id });
    }
  } catch {
    return partial;
  }
  return partial;
}

export const createCaseAction = createAction({
  auth: sprinklrAuth,
  name: 'create_case',
  classification: 'WRITE',
  displayName: 'Create Case',
  description: 'Creates a case for a customer contact.',
  audience: 'both',
  aiMetadata: {
    description:
      "Creates a new Sprinklr case for a customer reached by email or SMS; Sprinklr finds or creates the customer's profile from the email or phone. Use Update Case to change an existing case instead. Each call creates a new case, so a retry makes a duplicate; it is never retried after a server error or a timeout.",
    idempotent: false,
  },
  outputSchema: sprinklrCase.outputSchema,
  propertyGroups: [
    { key: 'case', display: 'section', label: 'Case', icon: 'inbox', props: ['subject', 'description'] },
    { key: 'customer', display: 'section', label: 'Customer', icon: 'user', props: ['channel', 'contact', 'contact_name'] },
  ],
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Sprinklr adds the case number and channel in front of it.',
      placeholder: 'Order arrived damaged',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What the case is about.',
      required: false,
    }),
    channel: Property.StaticDropdown<Channel, true>({
      displayName: 'Channel',
      description: 'How the customer is reached.',
      display: 'cards',
      required: true,
      defaultValue: 'EMAIL',
      options: {
        options: [
          { label: 'Email', value: 'EMAIL', description: 'Email address', icon: 'send' },
          { label: 'SMS', value: 'SMS', description: 'Phone number', icon: 'reply' },
        ],
      },
    }),
    contact: Property.ShortText({
      displayName: 'Contact',
      description: 'Email for Email, or phone with country code for SMS.',
      placeholder: 'jane.doe@example.com',
      required: true,
    }),
    contact_name: Property.ShortText({
      displayName: 'Contact Name',
      description: "The customer's full name.",
      placeholder: 'Jane Doe',
      required: false,
    }),
    priority: Property.ShortText({
      displayName: 'Priority',
      description: 'A priority your Sprinklr account uses, like High.',
      placeholder: 'High',
      required: false,
      advanced: true,
    }),
    case_type: Property.ShortText({
      displayName: 'Case Type',
      description: 'A case type your Sprinklr account uses, like Complaint.',
      placeholder: 'Complaint',
      required: false,
      advanced: true,
    }),
    queue_id: Property.ShortText({
      displayName: 'Queue ID',
      description: 'The ID of the work queue to put the case in.',
      placeholder: '103197',
      required: false,
      advanced: true,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom field name and value pairs, like spr_uc_type: Complaint.',
      required: false,
      advanced: true,
    }),
    first_comment: Property.LongText({
      displayName: 'First Comment',
      description: 'A comment to add to the case when it is created.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const body = buildBody(context.propsValue);
    const data = await sprinklrClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: sprinklrEndpoints.CASE,
      body,
      retryOn5xx: false,
    });
    const created = returnedCase(data);
    if (isFullCase(created)) {
      return sprinklrCase.normalize(created);
    }
    return readBack({ auth: context.auth, created, body });
  },
});

type CreateCaseInput = {
  subject?: unknown;
  description?: unknown;
  channel?: unknown;
  contact?: unknown;
  contact_name?: unknown;
  priority?: unknown;
  case_type?: unknown;
  queue_id?: unknown;
  custom_fields?: unknown;
  first_comment?: unknown;
};
