import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import { mindeeAuth } from '../..';

export const mindeePredictDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'mindee_predict_document',
  displayName: 'Extract Document',
  description: 'Parse details of a document using OCR.',
  props: {
    account_name: Property.ShortText({
      displayName: 'Account Name',
      description:
        'Refers to your username or organization name with which you signed up with.',
      required: true,
      defaultValue: 'mindee',
    }),
    api_name: Property.StaticDropdown({
      displayName: 'API Name',
      description: 'Refers to the name of the API your are using.',
      required: true,
      defaultValue: 'full',
      options: {
        disabled: false,
        options: [
          {
            value: 'bank_account_details/v1',
            label: 'Bank Account Details OCR',
          },
          { value: 'expense_reports/v4', label: 'Receipt OCR' },
          { value: 'passport/v1', label: 'Passport OCR' },
          { value: 'invoices/v3', label: 'Invoice OCR' },
          { value: 'proof_of_address/v1', label: 'Proof of Address OCR' },
          { value: 'financial_document/v1', label: 'Financial Documents OCR' },
        ],
      },
    }),
    file: Property.LongText({
      displayName: 'File URL',
      description:
        'Remote file URL or Base64 string. We currently support .pdf (slower), .jpg, .png, .webp, .tiff and .heic formats',
      required: true,
    }),
  },
  run: async ({ auth, propsValue: { api_name, account_name, file } }) => {
    let headers,
      body = {};

    try {
      const form = new FormData();

      if (['https:', 'http:'].includes(new URL(file).protocol))
        form.append('document', await getRemoteFile(file));
      else form.append('document', createReadStream(file));

      body = form;
      headers = { ...form.getHeaders() };
    } catch (_) {
      body = { document: file };
      headers = { 'Content-Type': 'application/json' };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.mindee.net/v1/products/${account_name}/${api_name}/predict`,
      headers: {
        Authorization: `Token ${auth as string}`,
        ...headers,
      },
      body: body,
    });

    return response.body;
  },
});

async function getRemoteFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return await response.arrayBuffer();
}
