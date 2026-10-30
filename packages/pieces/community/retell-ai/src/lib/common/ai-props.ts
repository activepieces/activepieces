import { Property } from '@activepieces/pieces-framework';

export const retellAiProps = {
  id,
  e164Number,
  agentVersion,
  metadata,
  dynamicVariables,
  limit,
  paginationKey,
};

function id({ displayName, description, required = true }: { displayName: string; description: string; required?: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

function e164Number({ displayName, description, required = true }: { displayName: string; description: string; required?: boolean }) {
  return Property.ShortText({ displayName, description: `${description} E.164 format, for example +14157774444.`, required });
}

function agentVersion() {
  return Property.ShortText({
    displayName: 'Agent Version',
    description: 'Optional version number (for example 3) or version tag (for example prod). Empty = the agent default.',
    required: false,
  });
}

function metadata() {
  return Property.Json({
    displayName: 'Metadata',
    description: 'Optional JSON object stored with the record for your reference, for example {"customer_id": "123"}.',
    required: false,
  });
}

function dynamicVariables() {
  return Property.Json({
    displayName: 'Dynamic Variables',
    description:
      'Optional JSON object of prompt variables, for example {"customer_name": "Ann"}. Values are sent as text.',
    required: false,
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'Items per page, 1 to 1000. Default 50.',
    required: false,
    defaultValue: 50,
  });
}

function paginationKey() {
  return Property.ShortText({
    displayName: 'Pagination Key',
    description: 'pagination_key from the previous page. Empty for the first page.',
    required: false,
  });
}
