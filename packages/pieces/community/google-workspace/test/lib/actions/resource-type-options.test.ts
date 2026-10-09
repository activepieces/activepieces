import { describe, expect, it } from 'vitest';

import { addRecord } from '../../../src/lib/actions/add-record';
import { deleteRecord } from '../../../src/lib/actions/delete-record';
import { getRecord } from '../../../src/lib/actions/get-record';
import { searchRecords } from '../../../src/lib/actions/search-records';
import { updateRecord } from '../../../src/lib/actions/update-record';
import { RESOURCES } from '../../../src/lib/common/resources';
import type { Verb } from '../../../src/lib/common/resources';

type WithResourceType = { props: { resourceType: { options: { options: { label: string; value: string }[] } } } };

const optionValues = (action: WithResourceType) => action.props.resourceType.options.options.map((option) => option.value);
const typesFor = (verb: Verb) =>
  Object.values(RESOURCES)
    .filter((def) => def.verbs.includes(verb))
    .map((def) => def.type);

describe('resourceType dropdown', () => {
  it.each([
    { name: 'Add Record', action: addRecord, verb: 'create' as const },
    { name: 'Update Record', action: updateRecord, verb: 'update' as const },
    { name: 'Delete Record', action: deleteRecord, verb: 'delete' as const },
    { name: 'Get Record', action: getRecord, verb: 'get' as const },
    { name: 'Search Records', action: searchRecords, verb: 'list' as const },
  ])('should offer in $name only the types whose verbs include $verb', ({ action, verb }) => {
    expect(optionValues(action as unknown as WithResourceType)).toEqual(typesFor(verb));
  });

  it('should hide the types each mutation rejects', () => {
    expect(optionValues(addRecord as unknown as WithResourceType)).toEqual(['user', 'group', 'group_member', 'org_unit', 'role_assignment']);
    expect(optionValues(updateRecord as unknown as WithResourceType)).toEqual(['user', 'group', 'group_member', 'org_unit', 'chromeos_device']);
    expect(optionValues(deleteRecord as unknown as WithResourceType)).toEqual([
      'user',
      'group',
      'group_member',
      'org_unit',
      'mobile_device',
      'role_assignment',
    ]);
    expect(optionValues(getRecord as unknown as WithResourceType)).toEqual(Object.keys(RESOURCES));
  });
});
