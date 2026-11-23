import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient } from '../common/client';

function normalizePhoneNumber({ value }: { value: string }): string {
  const cleaned = value.replace(/[\s\-().]/g, '');
  if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    throw new Error(
      `Phone number "${value}" is not in E.164 format. Use a leading + and country code, e.g. +14155550123.`
    );
  }
  return cleaned;
}

function validateSenderId({ value }: { value: string }): string {
  if (!/^[A-Za-z0-9]{1,11}$/.test(value) || !/[A-Za-z]/.test(value)) {
    throw new Error(
      'Sender ID must be 1-11 letters or digits and contain at least one letter.'
    );
  }
  return value;
}

export const sendSmsAction = createAction({
  auth: amazonSnsAuth,
  name: 'send_sms',
  classification: 'WRITE',
  displayName: 'Send SMS',
  description: 'Sends a text message directly to a phone number through Amazon SNS.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends one SMS directly to a phone number (E.164, e.g. +14155550123) without a topic. New AWS accounts are in the SMS sandbox and can only text verified numbers, and the default monthly SMS spend limit is 1 USD; sends past it fail. Transactional is for critical messages such as one-time codes, Promotional for marketing. Not idempotent: every call sends and bills a new SMS. To notify all subscribers of a topic use Send Message instead.',
    idempotent: false,
  },
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Recipient in E.164 format, e.g. +14155550123.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The text to send. Long messages are split into several billed SMS parts.',
      required: true,
    }),
    sms_type: Property.StaticDropdown({
      displayName: 'SMS Type',
      description: 'Transactional for critical messages (codes, alerts); Promotional for marketing.',
      required: true,
      defaultValue: 'Transactional',
      options: {
        options: [
          { label: 'Transactional', value: 'Transactional' },
          { label: 'Promotional', value: 'Promotional' },
        ],
      },
    }),
    sender_id: Property.ShortText({
      displayName: 'Sender ID',
      description:
        'Optional alphanumeric sender name (1-11 characters). Only supported in some countries; ignored or rejected elsewhere.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'message_id', label: 'Message ID', description: 'Unique ID SNS assigned to the SMS.' },
      { key: 'phone_number', label: 'Phone Number', description: 'The normalised E.164 number the SMS was sent to.' },
    ],
  },
  async run(context) {
    const phoneNumber = normalizePhoneNumber({ value: context.propsValue.phone_number });
    const smsType = context.propsValue.sms_type;
    if (smsType !== 'Transactional' && smsType !== 'Promotional') {
      throw new Error('SMS Type must be Transactional or Promotional.');
    }
    const rawSenderId = context.propsValue.sender_id?.trim();
    const senderId =
      isNil(rawSenderId) || rawSenderId === '' ? undefined : validateSenderId({ value: rawSenderId });
    const attributes: Record<string, { DataType: string; StringValue: string }> = {
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: smsType },
    };
    if (senderId) {
      attributes['AWS.SNS.SMS.SenderID'] = { DataType: 'String', StringValue: senderId };
    }
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const response = await callSns({
      operation: 'send SMS',
      call: () =>
        client.send(
          new sdk.PublishCommand({
            PhoneNumber: phoneNumber,
            Message: context.propsValue.message,
            MessageAttributes: attributes,
          })
        ),
    });
    return {
      message_id: response.MessageId ?? null,
      phone_number: phoneNumber,
    };
  },
});

export { normalizePhoneNumber, validateSenderId };
