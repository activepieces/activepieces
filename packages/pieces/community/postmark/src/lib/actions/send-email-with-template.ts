import { createAction, Property } from '@activepieces/pieces-framework';

import { postmarkAuth } from '../auth';
import { postmarkClient, SendEmailResponse } from '../common/client';
import { normalizeEmails } from '../common/utils';

type SendEmailWithTemplateProps = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  templateId: number;
  templateModel: Record<string, unknown>;
  tag?: string;
  trackOpens?: boolean;
  messageStream?: string;
};

export const sendEmailWithTemplate = createAction({
  name: 'send_email_with_template',
  displayName: 'Send Email With Template',
  description: 'Send an email using a Postmark template ID and template model.',
  auth: postmarkAuth,
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'Sender email address configured in Postmark.',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses.',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      required: false,
    }),
    templateId: Property.Number({
      displayName: 'Template ID',
      description: 'Numeric Postmark template ID.',
      required: true,
    }),
    templateModel: Property.Json({
      displayName: 'Template Model',
      description: 'JSON object used to populate the Postmark template.',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      required: false,
    }),
    trackOpens: Property.Checkbox({
      displayName: 'Track Opens',
      required: false,
      defaultValue: true,
    }),
    messageStream: Property.ShortText({
      displayName: 'Message Stream',
      description: 'Defaults to outbound if omitted.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as SendEmailWithTemplateProps;

    const payload = {
      From: props.from,
      To: normalizeEmails(props.to),
      Cc: normalizeEmails(props.cc),
      Bcc: normalizeEmails(props.bcc),
      ReplyTo: props.replyTo?.trim() || undefined,
      TemplateId: props.templateId,
      TemplateModel: props.templateModel,
      Tag: props.tag?.trim() || undefined,
      TrackOpens: props.trackOpens,
      MessageStream: props.messageStream?.trim() || 'outbound',
    };

    const response = await postmarkClient.post<SendEmailResponse>(
      context.auth.secret_text,
      '/email/withTemplate',
      payload
    );

    return {
      success: response.ErrorCode === 0,
      response,
    };
  },
});
