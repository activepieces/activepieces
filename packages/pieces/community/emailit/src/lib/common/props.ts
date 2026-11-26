import { Property } from '@activepieces/pieces-framework';

function emailId({ description }: { description?: string } = {}) {
  return Property.ShortText({
    displayName: 'Email ID',
    description: description ?? 'The ID from a Send Email or Find Emails step.',
    placeholder: 'em_4KYof1ZzXndZE2VPi0DgULiekG8',
    required: true,
  });
}

function audienceId() {
  return Property.ShortText({
    displayName: 'Audience',
    description: 'The audience ID (aud_…) or its exact name. Use List Audiences to find it.',
    required: true,
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'Results per page, from 1 to 100. Empty: 25.',
    required: false,
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page number, from 1. Raise it while Has More Pages is true.',
    required: false,
  });
}

function idempotencyKey() {
  return Property.ShortText({
    displayName: 'Idempotency Key',
    description:
      'Optional. A unique value (letters, digits, - and _; up to 256) such as an order ID. If this step runs again with the same key within 24 hours, Emailit returns the first result instead of sending again.',
    required: false,
  });
}

function recipientList({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.Array({ displayName, description, required });
}

function sendingProps() {
  return {
    scheduled_at: Property.DateTime({
      displayName: 'Send At',
      description: 'Leave empty to send now.',
      required: false,
    }),
    template: Property.ShortText({
      displayName: 'Template',
      description: 'Template ID or alias. Subject and body here override it.',
      placeholder: 'welcome-email',
      required: false,
    }),
    variables: Property.Json({
      displayName: 'Template Variables',
      description: 'Placeholder values as JSON, e.g. {"first_name": "Ada"}.',
      required: false,
    }),
    meta: Property.Object({
      displayName: 'Metadata',
      description: 'Your own key-value data, returned in webhooks.',
      required: false,
    }),
    tracking: Property.StaticDropdown<'default' | 'on' | 'off'>({
      displayName: 'Open & Click Tracking',
      description: "Needs the domain's tracking CNAME to be verified.",
      required: false,
      defaultValue: 'default',
      options: {
        disabled: false,
        options: [
          { label: 'Domain default', value: 'default' },
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
    attachments: Property.Array({
      displayName: 'Attachment URLs',
      description: 'Public links Emailit downloads when sending, up to 25 MB each.',
      required: false,
      properties: {
        filename: Property.ShortText({ displayName: 'File Name', description: 'Include the extension.', placeholder: 'invoice.pdf', required: true }),
        url: Property.ShortText({ displayName: 'File URL', placeholder: 'https://example.com/invoice.pdf', required: true }),
      },
    }),
    attachment_file: Property.File({
      displayName: 'Attachment File',
      description: 'A file from a previous step.',
      required: false,
    }),
    idempotency_key: idempotencyKey(),
  };
}

export const emailitProps = { emailId, audienceId, limit, page, idempotencyKey, recipientList, sendingProps };
