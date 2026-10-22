import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coretoolAuth } from '../auth';
import { coretoolClient } from '../common/client';

const FORMAT_OPTIONS = [
  { label: 'ZUGFeRD (PDF/A-3 with embedded XML)', value: 'zugferd' },
  { label: 'XRechnung CII (XML)', value: 'xrechnung_cii' },
  { label: 'XRechnung UBL (XML)', value: 'xrechnung_ubl' },
];

const TEMPLATE_OPTIONS = [
  { label: 'Classic', value: 'classic' },
  { label: 'Clean', value: 'clean' },
  { label: 'Subtle (dezent)', value: 'dezent' },
  { label: 'Modern', value: 'modern' },
];

const TAX_EXEMPTION_OPTIONS = [
  { label: 'Small business (Kleinunternehmer, § 19 UStG)', value: 'kleinunternehmer' },
  { label: 'Reverse charge (§ 13b UStG)', value: 'reverse_charge' },
  { label: 'Intra-community supply', value: 'innergemeinschaftlich' },
  { label: 'Tax-exempt letting (Vermietung)', value: 'vermietung' },
  { label: 'Tax-exempt (§ 4 UStG)', value: 'steuerfrei_4' },
];

export const createEInvoice = createAction({
  auth: coretoolAuth,
  name: 'create_e_invoice',
  displayName: 'Create E-Invoice',
  description:
    'Creates a German e-invoice (ZUGFeRD PDF or XRechnung XML) from your invoice data and returns the file.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Use this to generate a legally compliant German e-invoice file (ZUGFeRD or XRechnung) from seller, buyer and line item data. Every call creates a new file and uses one API call of the plan, so do not repeat it for the same invoice unless a new file is wanted.',
    idempotent: false,
  },
  props: {
    format: Property.StaticDropdown({
      displayName: 'Format',
      description:
        'ZUGFeRD is a PDF with embedded XML for private and business customers. XRechnung is pure XML for public authorities and requires seller email, seller phone and a buyer email or Leitweg-ID.',
      required: true,
      defaultValue: 'zugferd',
      options: { disabled: false, options: FORMAT_OPTIONS },
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Your unique invoice number, e.g. RE-2026-001.',
      required: true,
    }),
    invoiceDate: Property.DateTime({
      displayName: 'Invoice Date',
      description: 'Format YYYY-MM-DD.',
      required: true,
    }),
    deliveryDate: Property.DateTime({
      displayName: 'Delivery / Service Date',
      description: 'Date of delivery or service (YYYY-MM-DD). Optional.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO 4217 code.',
      required: false,
      defaultValue: 'EUR',
    }),
    sellerName: Property.ShortText({ displayName: 'Seller Name', description: 'Your company or trading name, e.g. Example Ltd.', required: true }),
    sellerStreet: Property.ShortText({ displayName: 'Seller Street', required: true }),
    sellerZip: Property.ShortText({ displayName: 'Seller ZIP Code', required: true }),
    sellerCity: Property.ShortText({ displayName: 'Seller City', required: true }),
    sellerCountry: Property.ShortText({ displayName: 'Seller Country', description: 'ISO 3166-1 alpha-2 code.', required: false, defaultValue: 'DE' }),
    sellerEmail: Property.ShortText({ displayName: 'Seller Email', description: 'Required for XRechnung.', required: false }),
    sellerPhone: Property.ShortText({ displayName: 'Seller Phone', description: 'Required for XRechnung.', required: false }),
    sellerTaxNumber: Property.ShortText({ displayName: 'Seller Tax Number (Steuernummer)', description: 'Tax number or VAT ID is required.', required: false }),
    sellerVatId: Property.ShortText({ displayName: 'Seller VAT ID', description: 'E.g. DE123456789. Tax number or VAT ID is required.', required: false }),
    buyerName: Property.ShortText({ displayName: 'Buyer Name', required: true }),
    buyerStreet: Property.ShortText({ displayName: 'Buyer Street', required: true }),
    buyerZip: Property.ShortText({ displayName: 'Buyer ZIP Code', required: true }),
    buyerCity: Property.ShortText({ displayName: 'Buyer City', required: true }),
    buyerCountry: Property.ShortText({ displayName: 'Buyer Country', description: 'ISO 3166-1 alpha-2 code.', required: false, defaultValue: 'DE' }),
    buyerEmail: Property.ShortText({ displayName: 'Buyer Email', description: 'Required for XRechnung unless a Leitweg-ID is given.', required: false }),
    buyerPhone: Property.ShortText({ displayName: 'Buyer Phone', required: false }),
    buyerVatId: Property.ShortText({ displayName: 'Buyer VAT ID', description: 'Needed for reverse charge and intra-community supplies.', required: false }),
    items: Property.Json({
      displayName: 'Line Items',
      description:
        'JSON array of line items. Fields: description, quantity, unit (e.g. C62 = piece, HUR = hour), unit_price (net), vat_rate.',
      required: true,
      defaultValue: [{ description: 'Consulting services', quantity: 2, unit: 'HUR', unit_price: 95, vat_rate: 19 }],
    }),
    iban: Property.ShortText({ displayName: 'IBAN', required: false }),
    bic: Property.ShortText({ displayName: 'BIC', required: false }),
    bankName: Property.ShortText({ displayName: 'Bank Name', required: false }),
    dueDays: Property.Number({ displayName: 'Payment Due (Days)', description: 'Days until payment is due, e.g. 14.', required: false }),
    dueDate: Property.DateTime({ displayName: 'Due Date', description: 'Fixed due date (YYYY-MM-DD), alternative to due days.', required: false }),
    paymentTerms: Property.LongText({ displayName: 'Payment Terms', description: 'Free text, max. 300 characters.', required: false }),
    buyerReference: Property.ShortText({ displayName: 'Buyer Reference', description: 'Do not combine with a Leitweg-ID.', required: false }),
    leitwegId: Property.ShortText({ displayName: 'Leitweg-ID', description: 'Routing ID of German public authorities (XRechnung).', required: false }),
    orderReference: Property.ShortText({ displayName: 'Order Reference', required: false }),
    notes: Property.LongText({ displayName: 'Notes', description: 'Max. 1000 characters.', required: false }),
    taxExemption: Property.StaticDropdown({
      displayName: 'Tax Exemption',
      description: 'Only if no VAT is charged.',
      required: false,
      options: { disabled: false, options: TAX_EXEMPTION_OPTIONS },
    }),
    taxExemptionDetail: Property.ShortText({ displayName: 'Tax Exemption Detail', required: false }),
    template: Property.StaticDropdown({
      displayName: 'PDF Template',
      description: 'Layout of the ZUGFeRD PDF.',
      required: false,
      options: { disabled: false, options: TEMPLATE_OPTIONS },
    }),
    accentColor: Property.ShortText({ displayName: 'Accent Color', description: 'Hex color for the PDF, e.g. #B87333.', required: false }),
    logoBase64: Property.LongText({ displayName: 'Logo (Base64)', description: 'PNG or JPEG as Base64, ZUGFeRD only.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    if (!p.sellerTaxNumber && !p.sellerVatId) {
      throw new Error('Seller Tax Number or Seller VAT ID is required');
    }
    if (p.buyerReference && p.leitwegId) {
      throw new Error('Use either Buyer Reference or Leitweg-ID, not both');
    }
    if (p.notes && p.notes.length > 1000) {
      throw new Error('Notes: max. 1000 characters');
    }
    if (p.paymentTerms && p.paymentTerms.length > 300) {
      throw new Error('Payment Terms: max. 300 characters');
    }
    if (p.logoBase64 && p.format !== 'zugferd') {
      throw new Error('A logo is only possible with the ZUGFeRD format');
    }

    const body = coretoolClient.removeEmpty({
      format: p.format,
      invoice_number: p.invoiceNumber,
      invoice_date: coretoolClient.dateOnly({ value: p.invoiceDate, label: 'Invoice Date' }),
      delivery_date: coretoolClient.dateOnly({ value: p.deliveryDate, label: 'Delivery / Service Date' }),
      currency: p.currency || 'EUR',
      seller: {
        name: p.sellerName,
        street: p.sellerStreet,
        zip: p.sellerZip,
        city: p.sellerCity,
        country: p.sellerCountry || 'DE',
        email: p.sellerEmail,
        phone: p.sellerPhone,
        tax_number: p.sellerTaxNumber,
        vat_id: p.sellerVatId,
      },
      buyer: {
        name: p.buyerName,
        street: p.buyerStreet,
        zip: p.buyerZip,
        city: p.buyerCity,
        country: p.buyerCountry || 'DE',
        email: p.buyerEmail,
        phone: p.buyerPhone,
        vat_id: p.buyerVatId,
      },
      items: coretoolClient.parseLineItems(p.items),
      payment: {
        iban: p.iban,
        bic: p.bic,
        bank_name: p.bankName,
        due_days: p.dueDays,
        due_date: coretoolClient.dateOnly({ value: p.dueDate, label: 'Due Date' }),
        terms: p.paymentTerms,
      },
      buyer_reference: p.buyerReference,
      leitweg_id: p.leitwegId?.trim(),
      order_reference: p.orderReference,
      notes: p.notes,
      tax_exemption: p.taxExemption,
      tax_exemption_detail: p.taxExemptionDetail,
      template: p.template,
      accent_color: p.accentColor,
      logo_base64: p.logoBase64,
    });

    const result = await coretoolClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/create',
      what: 'Could not create the e-invoice',
      body,
    });

    const { content_base64: content, ...meta } = result;
    if (typeof content !== 'string' || !content) {
      throw new Error('Could not create the e-invoice: the API returned no file content');
    }
    const extension = p.format === 'zugferd' ? 'pdf' : 'xml';
    const fileName = coretoolClient.safeFileName({
      name: meta['filename'],
      fallback: `${p.invoiceNumber}.${extension}`,
    });
    const file = await context.files.write({ fileName, data: Buffer.from(content, 'base64') });
    return { ...meta, filename: fileName, file };
  },
});
