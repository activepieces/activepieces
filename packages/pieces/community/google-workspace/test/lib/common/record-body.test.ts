import { describe, expect, it } from 'vitest';

import { googleWorkspaceUtils } from '../../../src/lib/common/utils';

const { recordBody, customFieldKey, resources } = googleWorkspaceUtils;

describe('recordBody()', () => {
  it('should nest form fields into the Directory API shape and drop empty ones', () => {
    expect(
      recordBody({
        def: resources.user,
        fields: { primaryEmail: 'jane@example.com', givenName: 'Jane', familyName: 'Doe', recoveryEmail: '', orgUnitPath: undefined },
        extra: undefined,
      })
    ).toEqual({ primaryEmail: 'jane@example.com', name: { givenName: 'Jane', familyName: 'Doe' } });
  });

  it('should keep a checkbox set to false, which an update must be able to send', () => {
    expect(recordBody({ def: resources.user, fields: { changePasswordAtNextLogin: false }, extra: undefined })).toEqual({
      changePasswordAtNextLogin: false,
    });
  });

  it('should merge Extra Fields with the form, the form winning on conflicts', () => {
    expect(
      recordBody({
        def: resources.group,
        fields: { name: 'Sales' },
        extra: '{"name": "ignored", "description": "from json"}',
      })
    ).toEqual({ name: 'Sales', description: 'from json' });
  });

  it('should put custom fields under customSchemas, multi-valued ones as value objects', () => {
    const single = customFieldKey({ schemaName: 'HR_Data', fieldName: 'employee_id' });
    const multi = customFieldKey({ schemaName: 'HR_Data', fieldName: 'skills' });

    expect(recordBody({ def: resources.user, fields: { [single]: 'E-42', [multi]: ['go', 'ts'] }, extra: undefined })).toEqual({
      customSchemas: { HR_Data: { employee_id: 'E-42', skills: [{ value: 'go' }, { value: 'ts' }] } },
    });
  });

  it('should ignore unknown keys and reject Extra Fields that are not an object', () => {
    expect(recordBody({ def: resources.group, fields: { custom_bad: 'x', other: 'y' }, extra: '' })).toEqual({});
    expect(() => recordBody({ def: resources.group, fields: {}, extra: '[1]' })).toThrow('The record must be a JSON object.');
  });
});
