import { describe, expect, it } from 'vitest';

import { RESOURCES, assertVerb, idOf, resourceDefinition, resourceTypeOptions } from '../../../src/lib/common/resources';

describe('RESOURCES', () => {
  it('should expose every type as a dropdown option with a label', () => {
    expect(resourceTypeOptions.map((o) => o.value)).toEqual(Object.keys(RESOURCES));
    expect(resourceTypeOptions.every((o) => o.label.length > 0)).toBe(true);
  });

  it('should build Directory paths, URL-encoding the identifiers', () => {
    expect(RESOURCES.user.collectionPath()).toBe('admin/directory/v1/users');
    expect(RESOURCES.user.itemPath({ id: 'jane@example.com' })).toBe('admin/directory/v1/users/jane%40example.com');
    expect(RESOURCES.group.itemPath({ id: ' sales@example.com ' })).toBe('admin/directory/v1/groups/sales%40example.com');
    expect(RESOURCES.mobile_device.collectionPath()).toBe('admin/directory/v1/customer/my_customer/devices/mobile');
    expect(RESOURCES.chromeos_device.itemPath({ id: 'abc-123' })).toBe('admin/directory/v1/customer/my_customer/devices/chromeos/abc-123');
    expect(RESOURCES.role_assignment.itemPath({ id: '42' })).toBe('admin/directory/v1/customer/my_customer/roleassignments/42');
  });

  it('should refuse an empty identifier before building a URL', () => {
    expect(() => RESOURCES.user.itemPath({ id: '' })).toThrow('The record identifier is empty');
    expect(() => RESOURCES.group.itemPath({ id: '   ' })).toThrow('The record identifier is empty');
    expect(() => RESOURCES.org_unit.itemPath({ id: '/' })).toThrow('The record identifier is empty');
  });

  it('should encode org unit paths without their leading slash', () => {
    expect(RESOURCES.org_unit.itemPath({ id: '/Sales/West' })).toBe('admin/directory/v1/customer/my_customer/orgunits/Sales%2FWest');
    expect(RESOURCES.org_unit.itemPath({ id: 'id:03ph8a2z1xyz' })).toBe('admin/directory/v1/customer/my_customer/orgunits/id%3A03ph8a2z1xyz');
  });

  it('should scope group members under their group and demand the group', () => {
    expect(RESOURCES.group_member.collectionPath('sales@example.com')).toBe('admin/directory/v1/groups/sales%40example.com/members');
    expect(RESOURCES.group_member.itemPath({ id: 'jane@example.com', parent: 'sales@example.com' })).toBe(
      'admin/directory/v1/groups/sales%40example.com/members/jane%40example.com'
    );
    expect(() => RESOURCES.group_member.collectionPath()).toThrow('fill in the group e-mail or id');
    expect(() => RESOURCES.group_member.itemPath({ id: 'jane@example.com', parent: '  ' })).toThrow('needs the parent record');
  });
});

describe('resourceDefinition()', () => {
  it('should return the definition or name the valid types', () => {
    expect(resourceDefinition('user').label).toBe('User');
    expect(() => resourceDefinition('calendar')).toThrow('Unknown resource type "calendar". Expected one of: user, group');
  });
});

describe('assertVerb()', () => {
  it('should allow what the collection supports and refuse the rest with the allowed list', () => {
    expect(() => assertVerb({ def: RESOURCES.user, verb: 'create' })).not.toThrow();
    expect(() => assertVerb({ def: RESOURCES.mobile_device, verb: 'create' })).toThrow(
      'Mobile device records do not support "create" through the Directory API (allowed: get, list, delete).'
    );
    expect(() => assertVerb({ def: RESOURCES.chromeos_device, verb: 'delete' })).toThrow('allowed: get, list, update');
  });
});

describe('idOf()', () => {
  it('should read the id field of the collection as a string, or null', () => {
    expect(idOf({ def: RESOURCES.user, item: { id: '1122', primaryEmail: 'j@e.com' } })).toBe('1122');
    expect(idOf({ def: RESOURCES.org_unit, item: { orgUnitId: 'id:abc', orgUnitPath: '/Sales' } })).toBe('id:abc');
    expect(idOf({ def: RESOURCES.mobile_device, item: { resourceId: 'AFiQ' } })).toBe('AFiQ');
    expect(idOf({ def: RESOURCES.group, item: { email: 'g@e.com' } })).toBeNull();
  });
});
