import { Property } from '@activepieces/pieces-framework';

function id({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function optionalId({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: false });
}

function text({ displayName, description, required = false }: { displayName: string; description: string; required?: boolean }) {
  return required ? Property.ShortText({ displayName, description, required: true }) : Property.ShortText({ displayName, description, required: false });
}

function number({ displayName, description }: { displayName: string; description: string }) {
  return Property.Number({ displayName, description, required: false });
}

function choice({ displayName, description, values }: { displayName: string; description: string; values: string[] }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: { options: values.map((value) => ({ label: value, value })) },
  });
}

function customFields({ update }: { update: boolean }) {
  return Property.Json({
    displayName: 'Custom Fields',
    description: update
      ? 'Object of custom field keys to values, e.g. {"industry_segment": "SMB"}. Merged into the existing custom fields; a key set to "" or null is removed.'
      : 'Object of custom field keys to values, e.g. {"industry_segment": "SMB"}.',
    required: false,
  });
}

function clearFields({ fields }: { fields: string[] }) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Clear Fields',
    description: `Field names to set to empty. Allowed: ${fields.join(', ')}. Do not also give a value for a cleared field.`,
    required: false,
    options: { options: fields.map((value) => ({ label: value, value })) },
  });
}

function page() {
  return Property.Number({ displayName: 'Page', description: 'Page number, starting at 1. Use nextPage from the previous result to continue.', required: false });
}

function limit() {
  return Property.Number({ displayName: 'Limit', description: 'Records per page, 1-100. Default 20.', required: false });
}

function sortBy({ values }: { values: string[] }) {
  return choice({ displayName: 'Sort By', description: `Sort field. Default created_at. One of: ${values.join(', ')}.`, values });
}

function sortOrder() {
  return choice({ displayName: 'Sort Order', description: 'asc or desc. Default desc.', values: ['desc', 'asc'] });
}

export const ninjapipeAiProps = { id, optionalId, text, number, choice, customFields, clearFields, page, limit, sortBy, sortOrder };
