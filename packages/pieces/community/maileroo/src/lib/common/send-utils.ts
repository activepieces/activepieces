import { Property, StaticPropsValue } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createCommonProps = () => {
  return {
    to: Property.Array({
      displayName: 'To',
      description: 'Emails of the recipients(Supports comma-separated emails)',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Sender name',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email(Your SMTP Email)',
      description: 'Sender email. This should come from your SMTP accounts.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the email',
      required: true,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'List of emails in bcc',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'List of emails in cc',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email to receive replies on (defaults to sender)',
      required: false,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'File to attach to the email you want to send',
      required: false,
    }),
  };
};

export const createFormData = (
  propsValue: StaticPropsValue<ReturnType<typeof createCommonProps>>
): FormData => {
  const { to, from, from_name, reply_to, subject, cc, bcc } = propsValue;

  const formData = new FormData();
  formData.append('from', `${from_name} <${from}>`);
  formData.append('to', to.join(','));
  formData.append('subject', subject);
  formData.append('reply_to', reply_to ?? from);

  if (cc) {
    formData.append('cc', cc.join(','));
  }
  if (bcc) {
    formData.append('bcc', bcc.join(','));
  }

  return formData;
};

export const sendFormData = async (
  url: string,
  formData: FormData,
  auth: string
) => {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `https://smtp.maileroo.com/${url}`,
    body: formData,
    headers: {
      ['X-API-Key']: auth,
      ...formData.getHeaders(),
    },
  });
};

export const checkEmail = async (email: string, apiKey: string) => {
  return httpClient.sendRequest({
    url: 'https://verify.maileroo.net/check',
    method: HttpMethod.POST,
    body: {
      email_address: email,
    },
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });
};
