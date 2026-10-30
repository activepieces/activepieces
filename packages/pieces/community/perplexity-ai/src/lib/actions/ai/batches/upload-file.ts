import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';

export const uploadFileAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_upload_file',
  displayName: 'Upload Batch File',
  description: 'Upload a JSONL file as batch input.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a JSONL file of up to 50,000 request lines and 200 MB as batch input; every line is validated first. Returns the file id to pass to Create Batch. Files expire after 30 days. Not idempotent: each call stores another file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'JSONL file, one request per line: {"custom_id":"1","method":"POST","url":"/v1/responses","body":{"model":"openai/gpt-6-luna","input":"..."}}.',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;
    const form = new FormData();
    form.append('purpose', 'batch');
    form.append('file', file.data, { filename: file.filename });
    return await perplexityAiClient.upload<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/files',
      form,
    });
  },
});
