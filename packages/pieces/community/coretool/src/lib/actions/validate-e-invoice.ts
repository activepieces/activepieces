import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coretoolAuth } from '../auth';
import { coretoolClient, MAX_UPLOAD_BYTES } from '../common/client';

export const validateEInvoice = createAction({
  auth: coretoolAuth,
  name: 'validate_e_invoice',
  displayName: 'Validate E-Invoice',
  description: 'Checks a ZUGFeRD PDF or XRechnung XML file against the official rules (EN 16931, KoSIT).',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Use this to check whether an existing e-invoice file (ZUGFeRD PDF or XRechnung XML, max. 5 MB) is valid and to get the list of errors. It does not change anything, so repeating it with the same file gives the same result.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'ZUGFeRD PDF or XRechnung XML, max. 5 MB.',
      required: true,
    }),
    report: Property.Checkbox({
      displayName: 'Include Detailed Report',
      description: 'Return the full validation report in addition to the result.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { file, report } = context.propsValue;
    const data = file.data;
    if (!data || data.length === 0) {
      throw new Error('Validate E-Invoice: the file is empty');
    }
    if (data.length > MAX_UPLOAD_BYTES) {
      throw new Error('Validate E-Invoice: the file is too large – the maximum is 5 MB');
    }
    const extension = (file.extension || '').toLowerCase();
    const fallback =
      extension === 'pdf' ? 'invoice.pdf' : extension === 'xml' ? 'invoice.xml' : 'invoice.bin';
    const fileName = coretoolClient.safeFileName({ name: file.filename, fallback });

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(data)]), fileName);

    return coretoolClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/validate',
      what: 'Could not validate the e-invoice',
      body: form,
      queryParams: { report: report ? 'true' : 'false' },
    });
  },
});
