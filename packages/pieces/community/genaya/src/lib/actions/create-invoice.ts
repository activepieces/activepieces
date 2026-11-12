import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi } from '../common/client';
import { genayaInput } from '../common/input';
import { genayaOutput } from '../common/mappers';
import { genayaProps } from '../common/props';
import { GenayaClient, GenayaInvoice } from '../common/types';

export const createInvoice = createAction({
  auth: genayaAuth,
  name: 'create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates a draft invoice in Genaya. Genaya calculates the totals from the line items.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a draft invoice in Genaya from one or more line items (name, quantity, unit price), optionally linked to an existing client by ID. Totals are always computed by Genaya. Use Send Invoice afterwards to mark it as sent. Each call creates a new invoice, so retries duplicate.',
    idempotent: false,
  },
  props: {
    client: genayaProps.clientDropdown({
      required: false,
      description:
        'The client to bill. Their name, email, phone and address are copied onto the invoice. The list shows your 100 most recent clients; map the ID from an earlier step (for example Find Client or Create Client) to use any other.',
    }),
    invoice_name: Property.ShortText({
      displayName: 'Invoice Name',
      description: 'A title for the invoice, for example "Spring HVAC service".',
      required: false,
    }),
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'At least one line is required.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Item Name',
          description: 'For example "HVAC tune-up".',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Item Description',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Must be greater than 0. Defaults to 1.',
          required: false,
        }),
        unit_price: Property.Number({
          displayName: 'Unit Price',
          description: 'Price per unit, for example 150.',
          required: true,
        }),
        taxable: Property.Checkbox({
          displayName: 'Taxable',
          description: 'Apply tax to this line.',
          required: false,
          defaultValue: false,
        }),
        tax_rate: Property.ShortText({
          displayName: 'Tax Rate',
          description: 'A percent such as 8.25% or 10, or a fraction such as 0.0825. Used only when Taxable is on.',
          required: false,
        }),
      },
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Written as YYYY-MM-DD, for example 2026-07-17. Defaults to today.',
      required: false,
    }),
    terms: Property.Number({
      displayName: 'Payment Terms (Days)',
      description: 'Net days to pay, for example 30.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter currency code. Defaults to USD.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes shown on the invoice, for example "Net 30 terms apply."',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const props = context.propsValue;
    const lineItems = lineItemsOf(props.line_items);
    if (lineItems.length === 0) {
      throw new Error('Add at least one line item with an Item Name and a Unit Price.');
    }
    const clientId = genayaInput.text(props.client);
    const client = clientId
      ? await genayaApi.getOne<GenayaClient>({ apiKey, path: `/clients/${encodeURIComponent(clientId)}` })
      : undefined;
    const body = genayaInput.compact({
      invoiceName: genayaInput.text(props.invoice_name),
      lineItems,
      dueDate: dateOnly(props.due_date),
      terms: genayaInput.number(props.terms),
      currency: genayaInput.text(props.currency)?.toUpperCase(),
      notes: genayaInput.text(props.notes),
      ...(client ? clientSnapshot(client) : {}),
    });
    const response = await genayaApi.request<{ data: GenayaInvoice }>({
      apiKey,
      method: HttpMethod.POST,
      path: '/invoices',
      body,
    });
    return genayaOutput.invoice(response.data);
  },
});

function lineItemsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((line) => {
    if (typeof line !== 'object' || line === null) {
      return [];
    }
    const name = genayaInput.text(Reflect.get(line, 'name'));
    const unitPrice = genayaInput.number(Reflect.get(line, 'unit_price'));
    if (name === undefined || unitPrice === undefined) {
      return [];
    }
    const taxable = Reflect.get(line, 'taxable') === true;
    return [
      genayaInput.compact({
        name,
        description: genayaInput.text(Reflect.get(line, 'description')),
        quantity: genayaInput.number(Reflect.get(line, 'quantity')) ?? 1,
        unitPrice,
        taxable,
        taxRate: taxable ? genayaInput.text(Reflect.get(line, 'tax_rate')) : undefined,
      }),
    ];
  });
}

// An invoice stores the client it was billed to as a snapshot, so the client's
// details are copied onto it the same way the Genaya app does.
function clientSnapshot(client: GenayaClient): Record<string, unknown> {
  const name =
    client.fullName || [client.firstName, client.lastName].filter(Boolean).join(' ') || client.company || undefined;
  return genayaInput.compact({
    clientId: client.id,
    clientDocId: client.id,
    clientUUID: client.uuid,
    clientName: name,
    firstName: client.firstName,
    lastName: client.lastName,
    companyName: client.company,
    email: client.email,
    phoneNumber: client.phone,
    address: client.address
      ? genayaInput.address({
          line1: client.address.line1,
          unit: client.address.unit,
          city: client.address.city,
          state: client.address.state,
          zip: client.address.zip,
          country: client.address.country,
        })
      : undefined,
  });
}

function dateOnly(value: unknown): string | undefined {
  const text = genayaInput.text(value);
  if (text === undefined) {
    return undefined;
  }
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (!match) {
    throw new Error(`Due Date must be written as YYYY-MM-DD, for example 2026-07-17. Received "${text}".`);
  }
  return match[0];
}
