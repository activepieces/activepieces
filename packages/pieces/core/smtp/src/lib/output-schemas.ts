import { OutputSchema } from '@activepieces/pieces-framework';

export const sendEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'accepted', label: 'Accepted Recipients' },
    { key: 'rejected', label: 'Rejected Recipients' },
    { key: 'pending', label: 'Pending Recipients' },
    { key: 'messageId', label: 'Message ID' },
    { key: 'response', label: 'SMTP Response' },
    {
      key: 'envelope',
      label: 'Envelope',
      children: [
        { key: 'from', label: 'From' },
        { key: 'to', label: 'To' },
      ],
    },
    { key: 'envelopeTime', label: 'Envelope Time (ms)', format: 'duration' },
    { key: 'messageTime', label: 'Message Time (ms)', format: 'duration' },
    { key: 'messageSize', label: 'Message Size', format: 'filesize' },
    { key: 'ehlo', label: 'Server Capabilities (EHLO)' },
  ],
};
