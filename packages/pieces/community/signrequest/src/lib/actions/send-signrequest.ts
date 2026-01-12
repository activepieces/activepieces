import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { signrequestAuth } from '../common/auth';

export const sendSignrequest = createAction({
  auth: signrequestAuth,
  name: 'send_signrequest',
  displayName: 'Send signrequest',
  description: 'Create a SignRequest via the Signrequest API',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: false,
    }),
    signers: Property.Json({
      displayName: 'Signers (JSON array)',
      description:
        'JSON array of signer objects. Example: [{"email":"john@example.com","name":"John Doe","role":"signer"}]',
      required: true,
    }),
    files: Property.Json({
      displayName: 'Files (JSON array)',
      description:
        'Optional JSON array describing files to attach. Use the shape expected by the Signrequest API (e.g. [{"url":"https://..."}])',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { title, subject, message, signers, files } = propsValue;

    const body: any = {
      title,
    };

    if (subject) body.subject = subject;
    if (message) body.message = message;

    if (signers) {
      body.signers = signers;
    }

    if (files) {
      body.files = files;
    }

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/signrequests/',
      body
    );

    return response;
  },
});
