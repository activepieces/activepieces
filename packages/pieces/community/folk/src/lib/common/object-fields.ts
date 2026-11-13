import { Property } from '@activepieces/pieces-framework';
import { folkAi } from './ai-common';
import { folkClient } from './client';
import { folkFields } from './fields';

function objectPath({ groupId, objectType }: { groupId: unknown; objectType: unknown }): string {
  return `/v1/groups/${folkClient.idSegment({ value: groupId, label: 'Group ID' })}/${folkClient.nameSegment({ value: objectType, label: 'Object Type' })}`;
}

function objectProps() {
  return {
    groupId: folkAi.idProp({ displayName: 'Group ID', description: 'ID of the group the objects live in (grp_...).' }),
    objectType: Property.ShortText({
      displayName: 'Object Type',
      description: 'Object type name as shown in the group, e.g. Deals.',
      required: true,
    }),
  };
}

function objectBodyProps({ forUpdate }: { forUpdate: boolean }) {
  const replaces = forUpdate ? ' Replaces the current links. Empty keeps them; to remove all, pick the list in Clear Fields.' : '';
  return {
    personIds: folkAi.listProp({ displayName: 'Person IDs', description: `People in this group to link (per_...); Folk ignores records outside the group.${replaces}` }),
    companyIds: folkAi.listProp({ displayName: 'Company IDs', description: `Companies in this group to link (com_...); Folk ignores records outside the group.${replaces}` }),
    customFieldValues: Property.Json({
      displayName: 'Custom Field Values',
      description:
        'Object fields as {"Field Name": value}, e.g. {"Status": "Qualified", "Amount": 5000}. null clears a field. Get names from List Group Custom Fields with the object type.',
      required: false,
    }),
  };
}

function clearFieldsProp() {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Clear Fields',
    description: 'Links to remove. A list named here is emptied even if IDs are also given for it.',
    required: false,
    options: {
      options: [
        { label: 'Person IDs (unlink all people)', value: 'people' },
        { label: 'Company IDs (unlink all companies)', value: 'companies' },
      ],
    },
  });
}

function objectBody({ props, clear = [] }: { props: ObjectInput; clear?: string[] }): Record<string, unknown> {
  const name = folkFields.textValue({ value: props.name });
  const people = clear.includes('people') ? [] : nonEmpty(folkFields.idList({ value: props.personIds, label: 'Person IDs', prefix: 'per_' }));
  const companies = clear.includes('companies')
    ? []
    : nonEmpty(folkFields.idList({ value: props.companyIds, label: 'Company IDs', prefix: 'com_' }));
  const fields = folkFields.jsonObject({ value: props.customFieldValues, label: 'Custom Field Values' });
  return {
    ...(name !== undefined ? { name } : {}),
    ...(people !== undefined ? { people: people.map((id) => ({ id })) } : {}),
    ...(companies !== undefined ? { companies: companies.map((id) => ({ id })) } : {}),
    ...(fields !== undefined ? { customFieldValues: fields } : {}),
  };
}

function nonEmpty(list: string[] | undefined): string[] | undefined {
  return list === undefined || list.length === 0 ? undefined : list;
}

export const folkObjectFields = { objectPath, objectProps, objectBodyProps, objectBody, clearFieldsProp, CLEAR_FIELDS: ['people', 'companies'] };

type ObjectInput = { name?: unknown; personIds?: unknown; companyIds?: unknown; customFieldValues?: unknown };
