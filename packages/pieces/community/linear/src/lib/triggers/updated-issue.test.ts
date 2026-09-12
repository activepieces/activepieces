/// <reference types="vitest/globals" />

import { vi } from 'vitest';

vi.mock('@linear/sdk', () => ({
  LinearClient: class {},
  LinearDocument: {},
}));

import '../../index';
import { linearUpdatedIssue } from './updated-issue';

const buildContext = (body: unknown, changed_fields?: string[]) =>
  ({
    payload: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      queryParams: {},
    },
    propsValue: { changed_fields },
  } as never);

const updateBody = (updatedFrom: Record<string, unknown>) => ({
  action: 'update',
  data: { id: 'issue_1' },
  updatedFrom,
});

describe('linear updated-issue run()', () => {
  test('no filter selected returns every update', async () => {
    const body = updateBody({ updatedAt: 'x', sortOrder: 1 });

    expect(await linearUpdatedIssue.run(buildContext(body))).toEqual([body]);
    expect(await linearUpdatedIssue.run(buildContext(body, []))).toEqual([body]);
  });

  test('non-update actions are always dropped', async () => {
    expect(
      await linearUpdatedIssue.run(buildContext({ action: 'create' }))
    ).toEqual([]);
    expect(
      await linearUpdatedIssue.run(
        buildContext({ action: 'remove' }, ['stateId'])
      )
    ).toEqual([]);
  });

  test('keeps the event when a selected field is in updatedFrom', async () => {
    const body = updateBody({ updatedAt: 'x', stateId: 'state_1' });

    expect(
      await linearUpdatedIssue.run(buildContext(body, ['stateId']))
    ).toEqual([body]);
  });

  test('drops the event when only noise fields changed', async () => {
    const body = updateBody({ updatedAt: 'x', sortOrder: 1 });

    expect(
      await linearUpdatedIssue.run(buildContext(body, ['stateId', 'assigneeId']))
    ).toEqual([]);
  });

  test('drops the event when updatedFrom is missing entirely', async () => {
    expect(
      await linearUpdatedIssue.run(
        buildContext({ action: 'update', data: {} }, ['stateId'])
      )
    ).toEqual([]);
  });

  test('matches on any one of several selected fields', async () => {
    const body = updateBody({ updatedAt: 'x', priority: 2 });

    expect(
      await linearUpdatedIssue.run(
        buildContext(body, ['stateId', 'assigneeId', 'priority'])
      )
    ).toEqual([body]);
  });
});
