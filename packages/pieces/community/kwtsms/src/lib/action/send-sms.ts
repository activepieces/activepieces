// 2026-11-16 +03: Send SMS action (POST /API/send/). Test mode defaults ON so a new flow never sends a real message by accident.
import { createAction, Property } from '@activepieces/pieces-framework';
import { kwtsmsAuth } from '../auth';
import { callKwtsms } from '../common';
import { chunkPhones, cleanMessage, normalizePhones } from '../common/normalize';
import { kwtsmsProps } from '../common/props';

type SendResponse = {
  'msg-id'?: string;
  numbers?: number;
  'points-charged'?: number;
  'balance-after'?: number;
  'unix-timestamp'?: number;
};

export const kwtsmsSendSms = createAction({
  auth: kwtsmsAuth,
  name: 'send_sms',
  classification: 'WRITE',
  description: 'Send an SMS to one or more mobile numbers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an SMS through kwtSMS to a list of mobile numbers with country code, from an approved sender ID. Numbers are cleaned automatically (Arabic digits, +, 00, spaces) and duplicates removed. Sending costs credits and is not idempotent: every call sends again. Test mode queues the message without delivering it.',
    idempotent: false,
  },
  displayName: 'Send SMS',
  props: {
    sender: kwtsmsProps.senderId(),
    mobile: kwtsmsProps.mobiles(
      'Numbers with country code, e.g. 965XXXXXXXX. Formats like +965 XXXX XXXX or 00965... are cleaned for you.',
    ),
    message: Property.LongText({
      displayName: 'Message',
      description:
        'Arabic or English. Emoji, hidden characters and HTML tags are removed before sending.',
      required: true,
    }),
    test: Property.Checkbox({
      displayName: 'Test Mode',
      description:
        'On: the message is queued but never delivered; its credits return when you delete it from the kwtSMS queue. Turn off to send for real.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { sender, mobile, message, test } = context.propsValue;
    const phones = normalizePhones(mobile);
    if (phones.length === 0) {
      throw new Error('ERR006: No valid numbers submitted.');
    }
    const text = cleanMessage(message);
    if (text === '') {
      throw new Error('ERR009: Message is empty after removing emoji and hidden characters.');
    }
    const msgIds: string[] = [];
    let numbers = 0;
    let charged = 0;
    let balanceAfter: number | undefined;
    for (const batch of chunkPhones(phones)) {
      const res = await callKwtsms<SendResponse>('send', context.auth.props, {
        sender,
        mobile: batch.join(','),
        message: text,
        test: test === false ? '0' : '1',
      });
      if (res['msg-id']) msgIds.push(res['msg-id']);
      numbers += res.numbers ?? batch.length;
      charged += res['points-charged'] ?? 0;
      balanceAfter = res['balance-after'] ?? balanceAfter;
    }
    return {
      result: 'OK',
      test: test !== false,
      'msg-id': msgIds[0],
      'msg-ids': msgIds,
      numbers,
      'points-charged': charged,
      'balance-after': balanceAfter,
    };
  },
});
