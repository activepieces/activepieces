import { Property } from '@activepieces/pieces-framework';

function modelProp({ description }: { description?: string } = {}) {
  return Property.ShortText({
    displayName: 'Model',
    description:
      description ??
      'Technical model name, for example res.partner (contacts), crm.lead, sale.order, account.move (invoices), product.product, project.task. Resolve unknown names with odoo_list_models.',
    required: true,
  });
}

function idProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.Number({ displayName, description, required: true });
}

function optionalIdProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.Number({ displayName, description, required: false });
}

function idsProp({ displayName = 'Record IDs', description }: { displayName?: string; description: string }) {
  return Property.Array({ displayName, description, required: true });
}

function fieldsProp() {
  return Property.Array({
    displayName: 'Fields',
    description:
      'Field names to return, for example ["name", "email", "partner_id"]. Leave empty for every field except binary ones (files, images). Get names from odoo_get_model_fields.',
    required: false,
  });
}

function domainProp() {
  return Property.Json({
    displayName: 'Domain',
    description:
      'Odoo domain: a JSON list of [field, operator, value] conditions, ANDed together; use "|" before two conditions for OR. Example [["is_company", "=", true], ["country_id.code", "=", "US"]]. Empty = all records.',
    required: false,
  });
}

function limitProp({ fallback, max }: { fallback: number; max: number }) {
  return Property.Number({
    displayName: 'Limit',
    description: `Maximum records to return. Default ${fallback}, maximum ${max}. Check has_more and pass next_offset as offset for the next page.`,
    required: false,
  });
}

function offsetProp() {
  return Property.Number({
    displayName: 'Offset',
    description: 'Number of records to skip, for paging. Use next_offset from the previous call.',
    required: false,
  });
}

function textProp({ displayName, description, required = false }: { displayName: string; description: string; required?: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

export const atomicProps = {
  modelProp,
  idProp,
  optionalIdProp,
  idsProp,
  fieldsProp,
  domainProp,
  limitProp,
  offsetProp,
  textProp,
};
