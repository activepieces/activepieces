import { Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from './auth';
import { invoiceNinjaClient } from './client';

async function optionsFor({ auth, entity, labelOf }: OptionsInput) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your Invoice Ninja account first.', options: [] };
  }
  try {
    const options: { label: string; value: string }[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 20) {
      const result = await invoiceNinjaClient.listPage({ auth: auth.props, entity, query: { status: 'active' }, page, perPage: 100 });
      for (const item of result.items) {
        if (invoiceNinjaClient.isRecord(item) && typeof item['id'] === 'string') {
          options.push({ label: labelOf(item), value: item['id'] });
        }
      }
      hasMore = result.hasMore;
      page += 1;
    }
    return {
      disabled: false,
      placeholder: hasMore ? 'Showing the first 2000; type an ID in a custom value for others.' : undefined,
      options,
    };
  } catch (error) {
    return {
      disabled: true,
      placeholder: error instanceof Error ? `Could not load: ${error.message}` : 'Could not load options.',
      options: [],
    };
  }
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clientDropdown({ required, displayName }: { required: boolean; displayName?: string }) {
  return Property.Dropdown({
    auth: invoiceninjaAuth,
    displayName: displayName ?? 'Client',
    description: 'The Invoice Ninja client.',
    required,
    refreshers: [],
    options: async ({ auth }) =>
      optionsFor({
        auth,
        entity: 'clients',
        labelOf: (item) => textOf(item['display_name']) || textOf(item['name']) || textOf(item['id']),
      }),
  });
}

function projectDropdown({ required }: { required: boolean }) {
  return Property.Dropdown({
    auth: invoiceninjaAuth,
    displayName: 'Project',
    description: 'The Invoice Ninja project (optional).',
    required,
    refreshers: [],
    options: async ({ auth }) =>
      optionsFor({
        auth,
        entity: 'projects',
        labelOf: (item) => textOf(item['name']) || textOf(item['id']),
      }),
  });
}

function lineItems({ required }: { required: boolean }) {
  return Property.Array({
    displayName: 'Line Items',
    description: 'One entry per line. Give a product key and/or description, the unit cost and the quantity. Values are used as given (no product price lookup).',
    required,
    properties: {
      product_key: Property.ShortText({ displayName: 'Product Key', description: 'Optional product key/name shown on the line.', required: false }),
      notes: Property.ShortText({ displayName: 'Description', required: false }),
      cost: Property.Number({ displayName: 'Unit Cost', required: true }),
      quantity: Property.Number({ displayName: 'Quantity', description: 'Default 1.', required: false }),
      discount: Property.Number({ displayName: 'Line Discount', description: 'Amount or percent, per the document discount type.', required: false }),
      tax_name1: Property.ShortText({ displayName: 'Tax Name', required: false }),
      tax_rate1: Property.Number({ displayName: 'Tax Rate (%)', required: false }),
    },
  });
}

function documentProps() {
  return {
    ...recurringDocumentProps(),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: false }),
  };
}

function recurringDocumentProps() {
  return {
    date: Property.ShortText({ displayName: 'Date', description: 'YYYY-MM-DD. Default today (company time zone).', required: false }),
    po_number: Property.ShortText({ displayName: 'PO Number', required: false }),
    discount: Property.Number({ displayName: 'Discount', description: 'Whole-document discount.', required: false }),
    is_amount_discount: Property.Checkbox({ displayName: 'Discount Is Amount', description: 'On = discount is an amount, off = percent. Default off (percent).', required: false }),
    public_notes: Property.LongText({ displayName: 'Public Notes', description: 'Visible to the client.', required: false }),
    private_notes: Property.LongText({ displayName: 'Private Notes', description: 'Internal only.', required: false }),
    terms: Property.LongText({ displayName: 'Terms', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', required: false }),
  };
}

function documentBody(props: Record<string, unknown>): Record<string, unknown> {
  return invoiceNinjaClient.compact({
    date: invoiceNinjaClient.toDateOnly({ value: props['date'], label: 'Date' }),
    due_date: invoiceNinjaClient.toDateOnly({ value: props['due_date'], label: 'Due Date' }),
    po_number: invoiceNinjaClient.optionalText(props['po_number']),
    discount: invoiceNinjaClient.optionalNumber({ value: props['discount'], label: 'Discount', min: 0 }),
    is_amount_discount: invoiceNinjaClient.parseBoolean(props['is_amount_discount']),
    public_notes: invoiceNinjaClient.optionalText(props['public_notes']),
    private_notes: invoiceNinjaClient.optionalText(props['private_notes']),
    terms: invoiceNinjaClient.optionalText(props['terms']),
    project_id: invoiceNinjaClient.optionalId({ value: props['project_id'], label: 'Project ID' }),
  });
}

function clearProp({ fields }: { fields: readonly string[] }) {
  return Property.StaticMultiSelectDropdown<string>({
    displayName: 'Clear Fields',
    description: 'Fields to blank out. Fields you leave empty above are not changed.',
    required: false,
    options: { options: fields.map((field) => ({ label: field, value: field })) },
  });
}

export const invoiceNinjaProps = { clientDropdown, projectDropdown, lineItems, documentProps, recurringDocumentProps, documentBody, clearProp };

type OptionsInput = {
  auth: { props: { base_url: string; access_token: string } } | undefined;
  entity: string;
  labelOf: (item: Record<string, unknown>) => string;
};
