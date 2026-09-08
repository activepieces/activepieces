/// <reference types="vitest/globals" />

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

import { createIssue } from '../src/lib/actions/create-issue';
import { createMilestone } from '../src/lib/actions/create-milestone';
import { createRock } from '../src/lib/actions/create-rock';
import { createTodo } from '../src/lib/actions/create-todo';
import { findMeasurables } from '../src/lib/actions/find-measurables';
import { findTodos } from '../src/lib/actions/find-todos';
import { listTeams } from '../src/lib/actions/list-teams';
import { setMeasurableScore } from '../src/lib/actions/set-measurable-score';
import { updateIssue } from '../src/lib/actions/update-issue';
import { updateRock } from '../src/lib/actions/update-rock';
import { updateTodo } from '../src/lib/actions/update-todo';

const auth = { secret_text: 'a-token' };

const lastBody = () => sendRequest.mock.calls.at(-1)?.[0]?.body;
const lastUrl = () => sendRequest.mock.calls.at(-1)?.[0]?.url;

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body });
}

function runAction(
  action: { run: (ctx: unknown) => Promise<unknown> },
  propsValue: unknown
) {
  return action.run({ auth, propsValue });
}

const A_ROCK = {
  title: 'x',
  teamId: 'team-1',
  dueDate: '2026-09-30T00:00:00.000Z',
  statusCode: 'ON_TRACK',
  levelCode: 'USER',
  quarter: 'Q3',
};

beforeEach(() => sendRequest.mockReset());

describe('priority, where an empty dropdown must not become zero', () => {
  test('an empty priority is omitted, not sent as 0', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, { title: 'x', teamId: 't1', priority: '' });
    expect('priority' in lastBody()).toBe(false);
  });

  test('a whitespace priority is omitted', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, { title: 'x', teamId: 't1', priority: '  ' });
    expect('priority' in lastBody()).toBe(false);
  });

  test('an unparseable priority is omitted rather than sent as NaN', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, { title: 'x', teamId: 't1', priority: 'high' });
    expect('priority' in lastBody()).toBe(false);
  });

  test('a real zero is still sent, since 0 means unrated', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, { title: 'x', teamId: 't1', priority: '0' });
    expect(lastBody().priority).toBe(0);
  });

  test('a priority that arrives already numeric is sent as is', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, { title: 'x', teamId: 't1', priority: 4 });
    expect(lastBody().priority).toBe(4);
  });

  test('the same rule holds on update', async () => {
    reply({ id: 'i1' });
    await runAction(updateIssue, { issueId: 'i1', priority: '' });
    expect('priority' in lastBody()).toBe(false);
  });
});

describe('dates, which Ninety wants in two different shapes', () => {
  test('a to-do due date already in day form is untouched', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'x', dueDate: '2026-09-11' });
    expect(lastBody().dueDate).toBe('2026-09-11');
  });

  test('surrounding whitespace on a date is ignored', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'x', dueDate: '  2026-09-11  ' });
    expect(lastBody().dueDate).toBe('2026-09-11');
  });

  test('a to-do search narrows both ends of the due-date window to days', async () => {
    reply([]);
    await runAction(findTodos, {
      dueDateFrom: '2026-09-01T10:00:00.000Z',
      dueDateTo: '2026-09-30T22:00:00.000Z',
    });
    expect(lastBody().dueDateFrom).toBe('2026-09-01');
    expect(lastBody().dueDateTo).toBe('2026-09-30');
  });

  test('a rock keeps a full timestamp on update, unlike a to-do', async () => {
    reply({ _id: 'r1' });
    await runAction(updateRock, {
      rockId: 'r1',
      dueDate: '2026-09-30T17:30:00.000Z',
    });
    expect(lastBody().dueDate).toBe('2026-09-30T17:30:00.000Z');
  });

  test('an invalid date is refused before the HTTP call', async () => {
    await expect(
      runAction(createTodo, { title: 'x', dueDate: 'next tuesday' })
    ).rejects.toThrow(/Due Date/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('a score period is normalised once and echoed back unchanged', async () => {
    reply({ ok: true });
    const result = await runAction(setMeasurableScore, {
      measurableId: 'k1',
      value: 12,
      periodStartDate: '2026-09-07',
    });
    expect(lastBody().periodStartDate).toBe('2026-09-07T00:00:00.000Z');
    expect(result).toEqual({
      measurableId: 'k1',
      value: 12,
      periodStartDate: '2026-09-07T00:00:00.000Z',
      response: { ok: true },
    });
  });
});

describe('score values that are easy to drop', () => {
  test('a score of zero is sent, not treated as no value', async () => {
    reply({});
    await runAction(setMeasurableScore, {
      measurableId: 'k1',
      value: 0,
      periodStartDate: '2026-09-07',
    });
    expect(lastBody().value).toBe(0);
  });

  test('a negative score is sent as given', async () => {
    reply({});
    await runAction(setMeasurableScore, {
      measurableId: 'k1',
      value: -4.5,
      periodStartDate: '2026-09-07',
    });
    expect(lastBody().value).toBe(-4.5);
  });

  test('the measurable id is encoded into the path', async () => {
    reply({});
    await runAction(setMeasurableScore, {
      measurableId: 'k/1',
      value: 1,
      periodStartDate: '2026-09-07',
    });
    expect(lastUrl()).toBe(
      'https://api.public.ninety.io/v1/scorecard/kpis/k%2F1/scores'
    );
  });
});

describe('text that must survive untouched', () => {
  test('unicode and emoji in a title are not mangled', async () => {
    reply({ id: 't1' });
    const title = 'Réunion trimestrielle — 目標 🎯';
    await runAction(createTodo, { title });
    expect(lastBody().title).toBe(title);
  });

  test('a very long description is passed through whole', async () => {
    reply({ id: 't1' });
    const description = 'x'.repeat(5000);
    await runAction(createTodo, { title: 'x', description });
    expect(lastBody().description).toHaveLength(5000);
  });

  test('quotes in a title are not escaped into the body', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'Fix the "handoff" step' });
    expect(lastBody().title).toBe('Fix the "handoff" step');
  });

  test('a unicode id is encoded into the path', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 'tâche', title: 'x' });
    expect(lastUrl()).toBe(
      'https://api.public.ninety.io/v1/todos/t%C3%A2che'
    );
  });
});

describe('the empty-string team, which Ninety treats as personal', () => {
  test('an explicitly empty team is passed through, since that means personal', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'x', teamId: '' });
    expect(lastBody().teamId).toBe('');
  });
});

describe('checkbox flags', () => {
  test('an untouched follow flag is omitted', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, A_ROCK);
    expect('addCreatorToFollowersList' in lastBody()).toBe(false);
  });

  test('an explicit false follow flag is sent', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      ...A_ROCK,
      addCreatorToFollowersList: false,
    });
    expect(lastBody().addCreatorToFollowersList).toBe(false);
  });

  test('an unowned-only search sends the flag it was given', async () => {
    reply({ items: [] });
    await runAction(findMeasurables, { unassignedOnly: true });
    expect(lastBody().unassignedOnly).toBe(true);
  });
});

describe('multi-selects', () => {
  test('chosen owners are sent as an array', async () => {
    reply([]);
    await runAction(findTodos, { userIds: ['u1', 'u2'] });
    expect(lastBody().userIds).toEqual(['u1', 'u2']);
  });

  test('chosen additional teams are nested inside the rock', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      ...A_ROCK,
      additionalTeamIds: ['t2', 't3'],
    });
    expect(lastBody().rock.additionalTeamIds).toEqual(['t2', 't3']);
  });

  test('an empty owner list on a measurable search is omitted', async () => {
    reply({ items: [] });
    await runAction(findMeasurables, { userIds: [] });
    expect('userIds' in lastBody()).toBe(false);
  });
});

describe('unsharing a rock, where an empty selection must not mean "wipe"', () => {
  test('an untouched multi-select leaves the additional teams alone', async () => {
    reply({ _id: 'r1' });
    await runAction(updateRock, { rockId: 'r1', additionalTeamIds: [] });
    expect('additionalTeamIds' in lastBody()).toBe(false);
  });

  test('the unshare checkbox is the only thing that sends an empty list', async () => {
    reply({ _id: 'r1' });
    await runAction(updateRock, {
      rockId: 'r1',
      additionalTeamIds: [],
      clearAdditionalTeams: true,
    });
    expect(lastBody().additionalTeamIds).toEqual([]);
  });

  test('a chosen set of teams is sent as it stands', async () => {
    reply({ _id: 'r1' });
    await runAction(updateRock, {
      rockId: 'r1',
      additionalTeamIds: ['t2', 't3'],
    });
    expect(lastBody().additionalTeamIds).toEqual(['t2', 't3']);
  });
});

describe('milestones', () => {
  test('the parent rock, its team and the due date are the whole body', async () => {
    reply({ _id: 'm1' });
    await runAction(createMilestone, {
      teamId: 't1',
      rockId: 'r1',
      title: 'x',
      dueDate: '2026-09-12T00:00:00.000Z',
    });
    expect(Object.keys(lastBody()).sort()).toEqual([
      'dueDate',
      'rockId',
      'teamId',
      'title',
    ]);
  });
});

describe('empty results', () => {
  test('a team list with nothing in it reports a count of zero', async () => {
    reply([]);
    const result = await runAction(listTeams, {});
    expect(result).toEqual({ teams: [], count: 0 });
  });

  test('an update with only an id sends an empty body rather than failing', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1' });
    expect(lastBody()).toEqual({});
  });
});
