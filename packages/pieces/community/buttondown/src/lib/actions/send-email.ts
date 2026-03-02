import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { buttondownAuth } from '../common/auth';
import { buttondownRequest } from '../common/client';
import {
  ButtondownEmail,
  ButtondownEmailInput,
  ButtondownEmailStatus,
  ButtondownEmailType,
} from '../common/types';

const emailStatusOptions: { label: string; value: ButtondownEmailStatus }[] = [
  { label: 'Send immediately (about_to_send)', value: 'about_to_send' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
];

const emailTypeOptions: { label: string; value: ButtondownEmailType }[] = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Premium', value: 'premium' },
  { label: 'Free', value: 'free' },
  { label: 'Churned', value: 'churned' },
  { label: 'Archival', value: 'archival' },
];

export const sendEmail = createAction({
  auth: buttondownAuth,
  name: 'sendEmail',
  displayName: 'Send Email',
  description: 'Send an email to your Buttondown subscribers.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description:
        'Write your email content in Markdown or HTML. Buttondown will detect the format automatically.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Delivery Status',
      description: 'Choose how Buttondown should treat this email after creation.',
      required: false,
      defaultValue: 'about_to_send',
      options: {
        options: emailStatusOptions,
      },
    }),
    publishDate: Property.DateTime({
      displayName: 'Publish Date',
      description: 'Required when scheduling an email. Use ISO 8601 format.',
      required: false,
    }),
    emailType: Property.StaticDropdown({
      displayName: 'Email Type',
      required: false,
      defaultValue: 'public',
      options: {
        options: emailTypeOptions,
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    canonicalUrl: Property.ShortText({
      displayName: 'Canonical URL',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Primary Image URL',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'Override the automatic slug used for the archive URL.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata to attach to the email (JSON object).',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachment IDs',
      description: 'IDs of attachments uploaded via the Buttondown API.',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Attachment ID',
          required: true,
        }),
      },
    }),
    triggerBilling: Property.Checkbox({
      displayName: 'Trigger Pay-per-email Billing',
      description:
        'Enable when this email should count against pay-per-email billing for paid subscribers.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!auth?.secret_text) {
      throw new Error('Authentication is required. Connect your Buttondown account.');
    }

    const status = (propsValue.status as ButtondownEmailStatus | undefined) ?? 'about_to_send';

    if (status === 'scheduled' && !propsValue.publishDate) {
      throw new Error('Publish date is required when scheduling an email.');
    }

    const payload: ButtondownEmailInput = {
      subject: propsValue.subject,
      body: propsValue.body,
      status,
    };

    if (propsValue.publishDate) {
      payload.publish_date = propsValue.publishDate;
    }

    if (propsValue.emailType) {
      payload.email_type = propsValue.emailType as ButtondownEmailType;
    }

    if (propsValue.description) {
      payload.description = propsValue.description;
    }

    if (propsValue.canonicalUrl) {
      payload.canonical_url = propsValue.canonicalUrl;
    }

    if (propsValue.image) {
      payload.image = propsValue.image;
    }

    if (propsValue.slug) {
      payload.slug = propsValue.slug;
    }

    if (propsValue.metadata) {
      if (typeof propsValue.metadata !== 'object' || Array.isArray(propsValue.metadata)) {
        throw new Error('Metadata must be provided as a JSON object.');
      }
      payload.metadata = propsValue.metadata as Record<string, unknown>;
    }

    const attachments = (propsValue.attachments as Array<{ id?: string }> | undefined)
      ?.map((entry) => entry.id?.trim())
      .filter((id): id is string => !!id);
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    if (propsValue.triggerBilling) {
      payload.should_trigger_pay_per_email_billing = true;
    }

    const email = await buttondownRequest<ButtondownEmail>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/emails',
      body: payload,
    });

    return email;
  },
});
