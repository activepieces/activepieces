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
  const replaces = forUpdate ? ' Replaces the current list; an empty list removes every link.' : '';
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

function objectBody({ props }: { props: ObjectInput }): Record<string, unknown> {
  const name = folkFields.textValue({ value: props.name });
  const people = folkFields.idList({ value: props.personIds, label: 'Person IDs', prefix: 'per_' });
  const companies = folkFields.idList({ value: props.companyIds, label: 'Company IDs', prefix: 'com_' });
  const fields = folkFields.jsonObject({ value: props.customFieldValues, label: 'Custom Field Values' });
  return {
    ...(name !== undefined ? { name } : {}),
    ...(people !== undefined ? { people: people.map((id) => ({ id })) } : {}),
    ...(companies !== undefined ? { companies: companies.map((id) => ({ id })) } : {}),
    ...(fields !== undefined ? { customFieldValues: fields } : {}),
  };
}

export const folkObjectFields = { objectPath, objectProps, objectBodyProps, objectBody };

type ObjectInput = { name?: unknown; personIds?: unknown; companyIds?: unknown; customFieldValues?: unknown };
