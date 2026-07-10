import { createAction, Property } from '@activepieces/pieces-framework';
import { polydocAuth } from '../common/auth';
import { buildRequestBody } from '../common/build-request-body';
import { extractApiErrorMessage, polyDocRequest } from '../common/client';
import { EINVOICE_PROFILES, EINVOICE_STANDARDS } from '../common/constants';
import { shapeOutput } from '../common/output';
import {
  advancedProp,
  asJsonObject,
  deliveryModeProp,
  filenameProp,
  presignedUrlProp,
  resolveDelivery,
  resolveMetadata,
  resolveSourceParams,
  sourceProp,
  sourceTypeProp,
  tagProp,
  templateDataProp,
  timeoutProp,
  webhookOptionsProp,
  webhookUrlProp,
} from '../common/props';
import type { PolyDocParams } from '../common/types';

const SAMPLE_INVOICE = {
  number: 'INV-001',
  issueDate: '2026-01-31',
  dueDate: '2026-03-02',
  currencyCode: 'EUR',
  seller: {
    name: 'Your Company GmbH',
    address: { line1: 'Main St 1', city: 'Berlin', postalCode: '10115', countryCode: 'DE' },
    taxId: 'DE123456789',
  },
  buyer: {
    name: 'Customer SARL',
    address: { line1: 'Rue 2', city: 'Paris', postalCode: '75001', countryCode: 'FR' },
  },
  lines: [
    { description: 'Widget', quantity: 2, unitPrice: 10, lineTotal: 20, vatRate: 19, vatCategoryCode: 'S' },
  ],
  taxSummary: [{ categoryCode: 'S', rate: 19, taxableAmount: 20, taxAmount: 3.8 }],
  paymentTerms: 'Net 30 days',
  totalNetAmount: 20,
  totalTaxAmount: 3.8,
  totalGrossAmount: 23.8,
};

export const generateEinvoice = createAction({
  auth: polydocAuth,
  name: 'generate_einvoice',
  displayName: 'Generate E-Invoice',
  description: 'Generate a hybrid e-invoice PDF (Factur-X / ZUGFeRD, EN 16931) from a visual layout plus structured invoice data.',
  aiMetadata: {
    description:
      'Generates a hybrid e-invoice PDF (Factur-X / ZUGFeRD, EN 16931) by embedding structured invoice XML into a visual PDF layout. EN 16931 requires payment terms or a due date, a seller tax ID for VAT category S, and consistent totals. Idempotent: the same input yields the same PDF.',
    idempotent: true,
  },
  props: {
    sourceType: sourceTypeProp('html'),
    source: sourceProp,
    templateData: templateDataProp,
    standard: Property.StaticDropdown({
      displayName: 'Standard',
      description: 'The hybrid e-invoice standard to embed.',
      required: true,
      defaultValue: 'zugferd',
      options: {
        disabled: false,
        options: EINVOICE_STANDARDS.map((o) => ({ label: o.label, value: o.value })),
      },
    }),
    profile: Property.StaticDropdown({
      displayName: 'Profile',
      description: 'The data granularity profile to validate against.',
      required: true,
      defaultValue: 'en16931',
      options: {
        disabled: false,
        options: EINVOICE_PROFILES.map((p) => ({ label: p, value: p })),
      },
    }),
    invoice: Property.Json({
      displayName: 'Invoice Data',
      description:
        'Structured invoice data: number, dates, currency, seller, buyer, lines, totals. EN 16931 needs payment terms (or due date), seller taxId for VAT category S, and consistent totals. See docs.polydoc.tech.',
      required: true,
      defaultValue: SAMPLE_INVOICE,
    }),
    verify: Property.Checkbox({
      displayName: 'Verify',
      description: 'Validate PDF/A and e-invoice compliance (returns an error if it fails).',
      required: false,
      defaultValue: false,
    }),
    deliveryMode: deliveryModeProp,
    presignedUrl: presignedUrlProp,
    webhookUrl: webhookUrlProp,
    webhookOptions: webhookOptionsProp,
    filename: filenameProp,
    tag: tagProp,
    timeout: timeoutProp,
    advanced: advancedProp,
  },
  async run(context) {
    const props = context.propsValue as Record<string, unknown>;
    const params: PolyDocParams = {
      operation: 'einvoice',
      ...resolveSourceParams(props),
      ...resolveMetadata(props),
      delivery: resolveDelivery(props),
      eInvoiceStandard: props['standard'] as 'facturx' | 'zugferd',
      eInvoiceProfile: props['profile'] as string,
      eInvoiceVerify: props['verify'] === true,
      invoice: asJsonObject(props['invoice']) ?? {},
    };

    const request = buildRequestBody(params);
    try {
      const response = await polyDocRequest(context.auth, request);
      return await shapeOutput({
        response,
        isBinary: request.isBinary,
        files: context.files,
        operation: 'einvoice',
        filename: params.filename,
      });
    } catch (error) {
      throw new Error(extractApiErrorMessage(error) ?? (error as Error).message);
    }
  },
});
