import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

async function countryId({ client, code }: { client: OdooClient; code: string | undefined }): Promise<number | undefined> {
  if (!code) return undefined;
  const ids = await client.call<number[]>({ model: 'res.country', method: 'search', args: [[['code', '=', code.trim().toUpperCase()]]], kwargs: { limit: 1 } });
  if (ids.length === 0) throw new Error(`Unknown country code "${code}". Use a two-letter ISO code such as US.`);
  return ids[0];
}

export const odooCreatePartner = createAction({
  auth: odooAuth,
  name: 'odoo_create_partner',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Create a contact person or company in Odoo.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Odoo contact (res.partner): a person or a company, optionally linked to a parent company, with email, phone, job, address (country by ISO code) and tax ID. Always creates; call odoo_find_partners first to avoid duplicates. Not idempotent.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.partner,
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Full name of the person or company.', required: true }),
    is_company: Property.Checkbox({ displayName: 'Is a Company', description: 'true for a company, false or omitted for a person.', required: false }),
    parent_id: atomicProps.optionalIdProp({ displayName: 'Parent Company ID', description: 'For a person: the ID of the company they work for.' }),
    email: atomicProps.textProp({ displayName: 'Email', description: 'For example jane@acme.example' }),
    phone: atomicProps.textProp({ displayName: 'Phone', description: 'For example +1 555 0100' }),
    function: atomicProps.textProp({ displayName: 'Job Position', description: 'For example Buyer' }),
    website: atomicProps.textProp({ displayName: 'Website', description: 'For example https://acme.example' }),
    vat: atomicProps.textProp({ displayName: 'Tax ID', description: 'VAT or tax number' }),
    ref: atomicProps.textProp({ displayName: 'Internal Reference', description: 'Your own code for this contact' }),
    street: atomicProps.textProp({ displayName: 'Street', description: 'Street and number' }),
    street2: atomicProps.textProp({ displayName: 'Street 2', description: 'Second address line' }),
    city: atomicProps.textProp({ displayName: 'City', description: 'City' }),
    zip: atomicProps.textProp({ displayName: 'ZIP', description: 'Postal code' }),
    country_code: atomicProps.textProp({ displayName: 'Country Code', description: 'Two-letter ISO code, for example US' }),
    customer_rank: Property.Number({ displayName: 'Customer Rank', description: 'Needs Invoicing. Set 1 to mark as a customer.', required: false }),
    supplier_rank: Property.Number({ displayName: 'Supplier Rank', description: 'Needs Invoicing. Set 1 to mark as a vendor.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const values = odooInput.definedOnly({
      name: p.name,
      is_company: p.is_company === true ? true : undefined,
      parent_id: odooInput.optionalId({ value: p.parent_id, label: 'Parent Company ID' }),
      email: odooInput.optionalText(p.email),
      phone: odooInput.optionalText(p.phone),
      function: odooInput.optionalText(p.function),
      website: odooInput.optionalText(p.website),
      vat: odooInput.optionalText(p.vat),
      ref: odooInput.optionalText(p.ref),
      street: odooInput.optionalText(p.street),
      street2: odooInput.optionalText(p.street2),
      city: odooInput.optionalText(p.city),
      zip: odooInput.optionalText(p.zip),
      country_id: await countryId({ client, code: odooInput.optionalText(p.country_code) }),
      customer_rank: odooInput.toOptionalNumber({ value: p.customer_rank, label: 'Customer Rank' }),
      supplier_rank: odooInput.toOptionalNumber({ value: p.supplier_rank, label: 'Supplier Rank' }),
    });
    const id = await client.call<number>({ model: odooApps.partner.model, method: 'create', args: [values] });
    return odooRecords.readApp({ client, model: odooApps.partner.model, id, wanted: odooApps.partner.fields, manyToOne: odooApps.partner.manyToOne });
  },
});
