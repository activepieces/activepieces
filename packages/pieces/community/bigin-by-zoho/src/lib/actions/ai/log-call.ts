import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { formatCallDuration, formatDateTimeKeepOffset } from '../../common/helpers';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginLogCallAi = createAction({
  auth: biginAuth,
  name: 'bigin_log_call',
  classification: 'WRITE',
  displayName: 'Log Call (Agent)',
  description: 'Log a phone call in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiCreateResult,
  aiMetadata: {
    description:
      'Logs a completed phone call in Bigin (the start time must be in the past) with start time, duration in minutes and call type, optionally linked to a contact and to a company or deal. Not idempotent: each call creates a new call log entry. Returns the new id and the saved record.',
    idempotent: false,
  },
  props: {
    callStartTime: Property.DateTime({
      displayName: 'Call Start Time',
      description: 'When the completed call started (ISO 8601). Must be in the past.',
      required: true,
    }),
    callDuration: Property.Number({
      displayName: 'Duration (minutes)',
      description: 'Call length in minutes (fractions allowed); sent to Bigin as mm:ss.',
      required: true,
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Direction of the call.',
      required: true,
      options: {
        options: [
          { label: 'Outbound', value: 'Outbound' },
          { label: 'Inbound', value: 'Inbound' },
          { label: 'Missed', value: 'Missed' },
        ],
      },
    }),
    subject: biginAiProps.text({ displayName: 'Subject', description: 'Call subject.', required: false }),
    contactId: biginAiProps.id({ displayName: 'Contact ID', description: 'Id of the contact who was called.', required: false }),
    relatedModule: Property.StaticDropdown({
      displayName: 'Related Module',
      description: 'Module of the company or deal the call is about. Set together with Related Record ID.',
      required: false,
      options: {
        options: [
          { label: 'Companies (Accounts)', value: 'Accounts' },
          { label: 'Pipelines (Deals)', value: 'Pipelines' },
        ],
      },
    }),
    relatedId: biginAiProps.relatedId(),
    ownerId: biginAiProps.ownerId(),
    description: biginAiProps.longText({ displayName: 'Description', description: 'Call notes.', required: false }),
    additionalFields: biginAiProps.additionalFields(),
  },
  async run(context) {
    const { propsValue } = context;
    if (Boolean(propsValue.relatedModule) !== Boolean(propsValue.relatedId)) {
      throw new Error('Related Module and Related Record ID must be set together.');
    }
    if (new Date(propsValue.callStartTime).getTime() > Date.now()) {
      throw new Error('Call Start Time must be in the past: this logs a completed call, and Bigin rejects a future start time with a duration.');
    }
    if (!Number.isFinite(propsValue.callDuration) || propsValue.callDuration < 0) {
      throw new Error('Duration must be a non-negative number of minutes.');
    }
    const record = biginRecords.mergeAdditionalFields({
      record: {
        Call_Start_Time: formatDateTimeKeepOffset(propsValue.callStartTime),
        Call_Duration: formatCallDuration(propsValue.callDuration),
        Call_Type: propsValue.callType,
        Subject: propsValue.subject ?? undefined,
        Who_Id: biginRecords.lookup(propsValue.contactId ?? undefined),
        What_Id: biginRecords.lookup(propsValue.relatedId ?? undefined),
        $se_module: propsValue.relatedId ? (propsValue.relatedModule === 'Pipelines' ? 'Deals' : propsValue.relatedModule) : undefined,
        Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
        Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    return biginRecords.create({ connection: getBiginConnection(context.auth), module: 'Calls', record });
  },
});
