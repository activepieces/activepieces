import { Property } from '@activepieces/pieces-framework';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';

function props({ nameRequired }: { nameRequired: boolean }) {
  return {
    name: Property.ShortText({ displayName: 'Name', description: 'Unique organization name.', required: nameRequired }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Your own reference for the organization.',
      required: false,
    }),
    domain_names: Property.Array({
      displayName: 'Domain Names',
      description: 'Email domains; new end users with these domains join the organization. Replaces the existing list.',
      required: false,
    }),
    group_id: zendeskAiProps.optionalId({
      displayName: 'Group ID',
      description: 'Group that new tickets from this organization go to, from List Groups.',
    }),
    details: Property.LongText({ displayName: 'Details', description: 'Details such as an address.', required: false }),
    notes: Property.LongText({ displayName: 'Notes', description: 'Internal notes visible to agents.', required: false }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces every tag on the organization. Prefer Add Organization Tags or Remove Organization Tags on existing ones.',
      required: false,
    }),
    organization_fields: Property.Json({
      displayName: 'Organization Fields',
      description: 'Object of custom organization field keys to values, keys from List Organization Fields.',
      required: false,
    }),
    shared_tickets: zendeskAiProps.optionalBoolean({
      displayName: 'Shared Tickets',
      description: 'Whether members can see each other tickets.',
    }),
    shared_comments: zendeskAiProps.optionalBoolean({
      displayName: 'Shared Comments',
      description: 'Whether members can comment on each other tickets.',
    }),
    additional_fields: zendeskAiProps.additionalFields({
      description: 'Other organization attributes from the Zendesk Organizations API, or null values to clear fields.',
    }),
  };
}

function body(values: OrganizationFieldValues): Record<string, unknown> {
  const tags = zendeskApi.stringList(values.tags);
  const domainNames = zendeskApi.stringList(values.domain_names);
  const organizationFields = zendeskApi.jsonObject({ value: values.organization_fields, label: 'Organization Fields' });
  return {
    ...zendeskApi.jsonObject({ value: values.additional_fields, label: 'Additional Fields' }),
    ...zendeskApi.compact({
      name: values.name,
      external_id: values.external_id,
      domain_names: domainNames.length > 0 ? domainNames : undefined,
      group_id: zendeskApi.optionalId({ value: values.group_id, label: 'Group ID' }),
      details: values.details,
      notes: values.notes,
      tags: tags.length > 0 ? tags : undefined,
      organization_fields: Object.keys(organizationFields).length > 0 ? organizationFields : undefined,
      shared_tickets: zendeskApi.optionalBoolean(values.shared_tickets),
      shared_comments: zendeskApi.optionalBoolean(values.shared_comments),
    }),
  };
}

export const zendeskOrganizationFields = { props, body };

type OrganizationFieldValues = {
  name?: string;
  external_id?: string;
  domain_names?: unknown[];
  group_id?: string;
  details?: string;
  notes?: string;
  tags?: unknown[];
  organization_fields?: unknown;
  shared_tickets?: string;
  shared_comments?: string;
  additional_fields?: unknown;
};
