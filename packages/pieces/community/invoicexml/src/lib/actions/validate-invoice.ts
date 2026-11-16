import { createAction, Property } from '@activepieces/pieces-framework';
import { invoicexmlAuth } from '../auth';
import { callInvoiceXml, fileForm, INVOICE_FORMATS } from '../common';

type Finding = {
  rule?: string | null;
  message?: string | null;
  line?: number | null;
};

type ValidationVerdict = {
  valid: boolean;
  detail?: string | null;
  errors?: Finding[] | null;
  warnings?: Finding[] | null;
};

const flattenFindings = (findings: Finding[] | null | undefined) =>
  (findings ?? []).map((f) => ({
    rule: f.rule ?? null,
    message: f.message ?? null,
    line: f.line ?? null,
  }));

export const validateInvoiceAction = createAction({
  auth: invoicexmlAuth,
  name: 'validate_invoice',
  classification: 'READ',
  displayName: 'Validate E-Invoice',
  description:
    'Checks an e-invoice file against the official EN 16931 and national rules and lists every error and warning.',
  audience: 'both',
  aiMetadata: {
    description:
      'Validate an existing XRechnung, ZUGFeRD, Factur-X, UBL or CII invoice file against the official Schematron rules and return a valid flag with the errors and warnings. Use to check a received or generated invoice before booking or sending it. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'The format of the invoice file.',
      required: true,
      options: {
        disabled: false,
        options: INVOICE_FORMATS.map(({ label, value }) => ({ label, value })),
      },
    }),
    file: Property.File({
      displayName: 'Invoice File',
      description: 'The XML file, or the PDF for ZUGFeRD and Factur-X.',
      required: true,
    }),
  },
  async run(context) {
    const { format, file } = context.propsValue;
    const verdict = await callInvoiceXml<ValidationVerdict>({
      apiKey: context.auth.secret_text,
      path: `/validate/${format}`,
      body: fileForm(file),
      responseType: 'json',
    });

    const errors = flattenFindings(verdict.errors);
    const warnings = flattenFindings(verdict.warnings);
    return {
      valid: verdict.valid,
      detail: verdict.detail ?? null,
      error_count: errors.length,
      warning_count: warnings.length,
      errors,
      warnings,
    };
  },
});
