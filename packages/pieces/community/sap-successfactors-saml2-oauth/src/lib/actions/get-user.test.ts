import { describe, expect, it } from 'vitest';
import { mapSuccessFactorsUser } from './get-user';

describe('mapSuccessFactorsUser', () => {
  it('maps the SuccessFactors response to the stable action output', () => {
    expect(
      mapSuccessFactorsUser({
        userId: '123',
        username: 'john.doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
        personIdExternal: 'person-123',
        department: 'Engineering',
        division: 'Technology',
        title: 'Engineer',
      }),
    ).toEqual({
      user_id: '123',
      username: 'john.doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      status: 'active',
      person_id_external: 'person-123',
      department: 'Engineering',
      division: 'Technology',
      title: 'Engineer',
    });
  });

  it('normalizes missing provider fields to null', () => {
    expect(
      mapSuccessFactorsUser({
        userId: '123',
      }),
    ).toEqual({
      user_id: '123',
      username: null,
      first_name: null,
      last_name: null,
      email: null,
      status: null,
      person_id_external: null,
      department: null,
      division: null,
      title: null,
    });
  });
});
