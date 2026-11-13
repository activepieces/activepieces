import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { mindeeAuth } from '../auth';
import { MINDEE_V1_BASE_URL, normalizeApiKey, toMindeeError, verifiedTls } from '../common/client';
import { mindeeFiles, MindeeUpload } from '../common/file';
import { mindeeSchemas } from '../output-schemas';

export const mindeePredictDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'mindee_predict_document',
  classification: 'READ',
  displayName: 'Predict Document (Legacy v1)',
  description: 'Legacy: parses a document with an off-the-shelf Mindee v1 API. Needs a v1 API key from platform.mindee.com; use Extract Document for v2 keys.',
  audience: 'human',
  aiMetadata: {
    description:
      'Legacy Mindee v1 prediction for existing flows: parses a receipt, invoice, passport, bank account details, proof of address or financial document with a v1 API key. Read-only analysis, idempotent.',
    idempotent: true,
  },
  props: {
    account_name: Property.ShortText({
      displayName: 'Account Name',
      description: 'Keep "mindee" for the off-the-shelf APIs.',
      required: true,
      defaultValue: 'mindee',
    }),
    api_name: Property.StaticDropdown({
      displayName: 'API Name',
      description: 'The Mindee v1 API to use.',
      required: true,
      defaultValue: 'invoices/v4',
      options: {
        disabled: false,
        options: [
          { value: 'invoices/v4', label: 'Invoice OCR (v4)' },
          { value: 'expense_reports/v5', label: 'Receipt OCR (v5)' },
          { value: 'financial_document/v1', label: 'Financial Documents OCR' },
          { value: 'passport/v1', label: 'Passport OCR' },
          { value: 'bank_account_details/v1', label: 'Bank Account Details OCR' },
          { value: 'proof_of_address/v1', label: 'Proof of Address OCR' },
          { value: 'invoices/v3', label: 'Invoice OCR (v3, older)' },
          { value: 'expense_reports/v4', label: 'Receipt OCR (v4, older)' },
        ],
      },
    }),
    upload: Property.File({
      displayName: 'File',
      description: 'The document to parse. Leave empty to use File URL or Base64 instead.',
      required: false,
    }),
    file: Property.LongText({
      displayName: 'File URL or Base64',
      description: 'An http(s) URL or Base64 string, used when File is empty.',
      required: false,
    }),
  },
  outputSchema: mindeeSchemas.legacyPrediction,
  run: async ({ auth, propsValue }) => {
    const accountName = pathSegment({ value: propsValue.account_name, label: 'Account Name' });
    const apiName = (propsValue.api_name ?? '').trim();
    if (!/^[a-z0-9_-]+\/v\d+$/i.test(apiName)) {
      throw new Error('Pick an API Name such as invoices/v4.');
    }
    const body = await requestBody({ upload: propsValue.upload, file: propsValue.file });
    try {
      const response = await httpClient.sendRequest<unknown>(
        {
          method: HttpMethod.POST,
          url: `${MINDEE_V1_BASE_URL}/products/${accountName}/${apiName}/predict`,
          headers: {
            Authorization: `Token ${normalizeApiKey(auth.secret_text)}`,
            Accept: 'application/json',
            ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          },
          body,
          followRedirects: false,
          redactBodyInErrors: true,
          timeout: 120_000,
        },
        { dispatcher: await verifiedTls() },
      );
      return response.body;
    } catch (error) {
      const mapped = toMindeeError({ error, api: 'v1' });
      if (mapped !== undefined) {
        throw mapped;
      }
      throw error;
    }
  },
});

async function requestBody({ upload, file }: { upload: unknown; file: string | undefined }): Promise<FormData | { document: string }> {
  if (upload !== undefined && upload !== null && upload !== '') {
    return multipart(mindeeFiles.readFileProp({ value: upload, label: 'File' }));
  }
  const value = (file ?? '').trim();
  if (value.length === 0) {
    throw new Error('Provide a File, or a File URL or Base64 string.');
  }
  if (/^https?:\/\//i.test(value)) {
    return { document: mindeeFiles.parseHttpsUrl({ value, label: 'File URL', allowHttp: true }).toString() };
  }
  const base64 = value.replace(/^data:[^;,]*;base64,/i, '').replace(/\s+/g, '');
  if (base64.length < 16 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error('File URL or Base64 must be an http(s) URL or a Base64 string. Local file paths are not supported.');
  }
  return { document: base64 };
}

function multipart(upload: MindeeUpload): FormData {
  const form = new FormData();
  form.append('document', mindeeFiles.toBlob(upload), upload.filename);
  return form;
}

function pathSegment({ value, label }: { value: string | undefined; label: string }): string {
  const trimmed = (value ?? '').trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    throw new Error(`${label} may only contain letters, numbers, dots, dashes and underscores.`);
  }
  return trimmed;
}
