import { Property } from '@activepieces/pieces-framework';

function organizationId() {
  return Property.ShortText({
    displayName: 'Organization ID',
    description:
      'Zoho Books organization ID, from List Organizations. Leave empty to use the default organization of the connection.',
    required: false,
  });
}

function contactId<R extends boolean>({
  required,
  displayName = 'Contact ID',
  description = 'Contact (customer or vendor) ID, from List Contacts or Create Contact.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function contactPersonId<R extends boolean>({
  required,
  displayName = 'Contact Person ID',
  description = 'Contact person ID, from List Contact Persons or Create Contact Person.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function invoiceId<R extends boolean>({
  required,
  displayName = 'Invoice ID',
  description = 'Invoice ID, from List Invoices or Create Invoice.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function customerPaymentId<R extends boolean>({
  required,
  displayName = 'Customer Payment ID',
  description = 'Customer payment ID, from List Customer Payments or Create Customer Payment.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function flag<R extends boolean>({
  required,
  displayName,
  description,
}: PropParams<R> & { displayName: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function additionalFields({ description }: { description: string }) {
  return Property.Json({ displayName: 'Additional Fields', description, required: false });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description:
      'Page number, starting at 1. When page_context.has_more_page is true, call again with the next page and the same filters.',
    required: false,
    defaultValue: 1,
  });
}

function perPage() {
  return Property.Number({
    displayName: 'Per Page',
    description: 'Records per page, 1 to 200. Defaults to 200.',
    required: false,
    defaultValue: 200,
  });
}

export const zohoBooksAiProps = {
  organizationId,
  contactId,
  contactPersonId,
  invoiceId,
  customerPaymentId,
  flag,
  additionalFields,
  page,
  perPage,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
