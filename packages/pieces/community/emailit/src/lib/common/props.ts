import { Property } from '@activepieces/pieces-framework';

function emailId({ description }: { description?: string } = {}) {
  return Property.ShortText({
    displayName: 'Email ID',
    description: description ?? 'The Emailit email ID, e.g. em_4KYof1ZzXndZE2VPi0DgULiekG8 (from a Send Email step or Find Emails).',
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
    description: 'Results per page, 1-100. Defaults to 25.',
    required: false,
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page to return, starting at 1. Use it when the previous result had Has More Pages = true.',
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
      description: 'Optional. Schedule the email for later (ISO 8601 with time zone). Leave empty to send now.',
      required: false,
    }),
    template: Property.ShortText({
      displayName: 'Template',
      description: 'Optional. A template ID (tem_…) or alias. Subject and body in this step override the template\'s.',
      required: false,
    }),
    variables: Property.Json({
      displayName: 'Template Variables',
      description: 'Optional. Values for {{placeholders}} in the subject and body, e.g. {"first_name": "Ada"}.',
      required: false,
    }),
    meta: Property.Object({
      displayName: 'Metadata',
      description: 'Optional. Your own key-value data stored with the email and sent back in webhooks, e.g. order_id: 1042.',
      required: false,
    }),
    tracking: Property.StaticDropdown<'default' | 'on' | 'off'>({
      displayName: 'Open & Click Tracking',
      description: 'Uses the sending domain\'s setting by default. Tracking only works when the domain\'s tracking CNAME is verified.',
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
      displayName: 'Attachments (by URL)',
      description: 'Optional. Files Emailit downloads when sending (public http/https URL, max 25 MB, no redirects).',
      required: false,
      properties: {
        filename: Property.ShortText({ displayName: 'File Name', description: 'Including the extension, e.g. invoice.pdf.', required: true }),
        url: Property.ShortText({ displayName: 'File URL', required: true }),
      },
    }),
    attachment_file: Property.File({
      displayName: 'Attachment (file)',
      description: 'Optional. A file from a previous step to attach.',
      required: false,
    }),
    idempotency_key: idempotencyKey(),
  };
}

export const emailitProps = { emailId, audienceId, limit, page, idempotencyKey, recipientList, sendingProps };
