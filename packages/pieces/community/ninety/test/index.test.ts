/// <reference types="vitest/globals" />

import { ninety } from '../src/index';

describe('the piece definition', () => {
  test('ships every action this piece promises, so none is silently dropped', () => {
    expect(Object.keys(ninety.actions()).sort()).toEqual(
      [
        'create_todo',
        'update_todo',
        'find_todos',
        'create_issue',
        'update_issue',
        'find_issues',
        'create_rock',
        'update_rock',
        'find_rocks',
        'create_milestone',
        'find_measurables',
        'set_measurable_score',
        'list_teams',
        'custom_api_call',
      ].sort()
    );
  });

  test('ships every trigger this piece promises', () => {
    expect(Object.keys(ninety.triggers()).sort()).toEqual(
      ['new_todo', 'new_issue', 'new_rock'].sort()
    );
  });

  test('the author handle is a real GitHub user, not the dead odaithalji typo', () => {
    expect(ninety.authors).toEqual(['OdaiAhmed99']);
  });
});
