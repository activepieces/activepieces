import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { CONFORMANCE_OPTIONS, fileToUploadInput, regionOf, regionProp, webhookOf, webhookUrlProp } from '../common/props';
import { iloveSchemas } from '../common/schemas';

export const validatePdfaAction = createAction({
  auth: iloveapiAuth,
  name: 'validate_pdfa',
  classification: 'READ',
  displayName: 'Validate PDF/A',
  description: 'Check whether a PDF conforms to a PDF/A level.',
  audience: 'both',
  outputSchema: iloveSchemas.validatePdfa,
  aiMetadata: {
    description:
      'Check whether a PDF meets a PDF/A conformance level, returning a per-file validation result and an overall "conformant" flag. Does not change the file and creates no output file, but each run spends iLoveAPI credits. Use Convert PDF to PDF/A to fix a non-conformant file.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    conformance: Property.StaticDropdown({
      displayName: 'Conformance Level',
      required: false,
      defaultValue: 'pdfa-2b',
      options: {
        disabled: false,
        options: CONFORMANCE_OPTIONS,
      },
    }),
    region: regionProp,
    webhook_url: webhookUrlProp,
  },
  async run(context) {
    const result = await iLoveApi.runTask({
      publicKey: context.auth.secret_text,
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      tool: 'validatepdfa',
      uploads: [fileToUploadInput({ file: context.propsValue.file, label: 'PDF File' })],
      options: { conformance: context.propsValue.conformance ?? 'pdfa-2b' },
      skipDownload: true,
    });
    const raw = result.process['validations'];
    const validations = Array.isArray(raw)
      ? raw.filter((item): item is Record<string, unknown> => iLoveApi.isRecord(item))
      : [];
    return {
      conformant:
        validations.length > 0 &&
        validations.every((item) => String(item['status']).toLowerCase() === 'conformant'),
      validations,
      status: result.process.status,
      timer: result.process.timer,
      task: result.task,
      remaining_credits: result.remainingCredits,
    };
  },
});
