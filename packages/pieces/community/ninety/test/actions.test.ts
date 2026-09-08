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
import { findIssues } from '../src/lib/actions/find-issues';
import { findMeasurables } from '../src/lib/actions/find-measurables';
import { findRocks } from '../src/lib/actions/find-rocks';
import { findTodos } from '../src/lib/actions/find-todos';
import { listTeams } from '../src/lib/actions/list-teams';
import { setMeasurableScore } from '../src/lib/actions/set-measurable-score';
import { updateIssue } from '../src/lib/actions/update-issue';
import { updateRock } from '../src/lib/actions/update-rock';
import { updateTodo } from '../src/lib/actions/update-todo';

const auth = { secret_text: 'a-token' };

const lastBody = () => sendRequest.mock.calls.at(-1)?.[0]?.body;
const lastUrl = () => sendRequest.mock.calls.at(-1)?.[0]?.url;
const lastMethod = () => sendRequest.mock.calls.at(-1)?.[0]?.method;

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body });
}

function runAction(action: { run: (ctx: unknown) => Promise<unknown> }, propsValue: unknown) {
  return action.run({ auth, propsValue });
}

beforeEach(() => sendRequest.mockReset());

describe('create to-do', () => {
  test('a to-do with no team is sent without a teamId, which is what makes it personal', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'Book the quarterly' });
    expect(lastBody()).toEqual({ title: 'Book the quarterly' });
  });

  test('a full timestamp is narrowed to the day, since Ninety wants YYYY-MM-DD here', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, {
      title: 'x',
      dueDate: '2026-09-11T16:45:00.000Z',
    });
    expect(lastBody().dueDate).toBe('2026-09-11');
  });

  test('a chosen team is sent through', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'x', teamId: 'team-1' });
    expect(lastBody().teamId).toBe('team-1');
  });
});

describe('update to-do', () => {
  test('only the fields that were set are sent, so nothing else is overwritten', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1', title: 'A new title' });
    expect(lastBody()).toEqual({ title: 'A new title' });
  });

  test('leaving completed unchanged omits the key rather than sending false', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1', completed: 'any' });
    expect('completed' in lastBody()).toBe(false);
  });

  test('choosing No sends false, which is how a to-do is reopened', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1', completed: 'no' });
    expect(lastBody().completed).toBe(false);
  });

  test('choosing Yes sends true', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1', completed: 'yes' });
    expect(lastBody().completed).toBe(true);
  });

  test('the to-do id lands in the path and never in the body', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1', title: 'x' });
    expect(lastUrl()).toBe('https://api.public.ninety.io/v1/todos/t1');
    expect('todoId' in lastBody()).toBe(false);
  });
});

describe('create issue', () => {
  test('the term is sent as interval, which is what create takes, not intervalCode', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, {
      title: 'Handoff keeps slipping',
      teamId: 'team-1',
      interval: 'LONG_TERM',
    });
    expect(lastBody().interval).toBe('LONG_TERM');
    expect('intervalCode' in lastBody()).toBe(false);
  });

  test('priority is sent as a number, not as the dropdown string', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, {
      title: 'x',
      teamId: 'team-1',
      priority: '3',
    });
    expect(lastBody().priority).toBe(3);
  });

  test('an unrated priority of zero is still sent, not dropped as falsy', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, {
      title: 'x',
      teamId: 'team-1',
      priority: '0',
    });
    expect(lastBody().priority).toBe(0);
  });
});

describe('update issue', () => {
  test('solving an issue sends completed true', async () => {
    reply({ id: 'i1' });
    await runAction(updateIssue, { issueId: 'i1', completed: 'yes' });
    expect(lastBody()).toEqual({ completed: true });
  });

  test('the issue id lands in the path', async () => {
    reply({ id: 'i1' });
    await runAction(updateIssue, { issueId: 'i 1', title: 'x' });
    expect(lastUrl()).toBe('https://api.public.ninety.io/v1/issues/i%201');
  });
});

describe('create rock', () => {
  test('the required fields are nested under rock, which is the shape the API takes', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      title: 'Cut onboarding time to 14 days',
      teamId: 'team-1',
      dueDate: '2026-09-30T00:00:00.000Z',
      statusCode: 'ON_TRACK',
      levelCode: 'USER',
      quarter: 'Q3',
    });
    expect(lastBody()).toEqual({
      rock: {
        title: 'Cut onboarding time to 14 days',
        teamId: 'team-1',
        dueDate: '2026-09-30T00:00:00.000Z',
        statusCode: 'ON_TRACK',
        levelCode: 'USER',
        quarter: 'Q3',
      },
    });
  });

  test('a rock keeps its full timestamp instead of being narrowed like a to-do', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      title: 'x',
      teamId: 'team-1',
      dueDate: '2026-09-30T17:00:00.000Z',
      statusCode: 'ON_TRACK',
      levelCode: 'USER',
      quarter: 'Q3',
    });
    expect(lastBody().rock.dueDate).toBe('2026-09-30T17:00:00.000Z');
  });

  test('an empty additional-teams selection is omitted rather than sent as an empty array', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      title: 'x',
      teamId: 'team-1',
      dueDate: '2026-09-30T00:00:00.000Z',
      statusCode: 'ON_TRACK',
      levelCode: 'USER',
      quarter: 'Q3',
      additionalTeamIds: [],
    });
    expect('additionalTeamIds' in lastBody().rock).toBe(false);
  });
});

describe('create milestone', () => {
  test('no done state is sent, because Ninety ignores it and always creates a milestone as not done', async () => {
    reply({ _id: 'm1' });
    await runAction(createMilestone, {
      teamId: 'team-1',
      rockId: 'r1',
      title: 'Publish the checklist',
      dueDate: '2026-09-12T00:00:00.000Z',
    });
    expect('isDone' in lastBody()).toBe(false);
    expect('completedDate' in lastBody()).toBe(false);
  });

  test('the parent rock and its team both travel with the milestone', async () => {
    reply({ _id: 'm1' });
    await runAction(createMilestone, {
      teamId: 'team-1',
      rockId: 'r1',
      title: 'x',
      dueDate: '2026-09-12T00:00:00.000Z',
    });
    expect(lastBody().rockId).toBe('r1');
    expect(lastBody().teamId).toBe('team-1');
  });
});

describe('find to-dos', () => {
  test('the personal scope maps to isPersonal true', async () => {
    reply([]);
    await runAction(findTodos, { scope: 'personal' });
    expect(lastBody().isPersonal).toBe(true);
  });

  test('the team scope maps to isPersonal false, not to an omitted key', async () => {
    reply([]);
    await runAction(findTodos, { scope: 'team' });
    expect(lastBody().isPersonal).toBe(false);
  });

  test('no scope leaves isPersonal out so Ninety applies its own default', async () => {
    reply([]);
    await runAction(findTodos, {});
    expect('isPersonal' in lastBody()).toBe(false);
  });

  test('to-dos page with the one-based page key, not the zero-based pageIndex', async () => {
    reply([]);
    await runAction(findTodos, { page: 2 });
    expect(lastBody().page).toBe(2);
    expect('pageIndex' in lastBody()).toBe(false);
  });

  test('to-dos sort with lowercase order, which is what this endpoint takes', async () => {
    reply([]);
    await runAction(findTodos, { sort: 'createdDate', order: 'desc' });
    expect(lastBody().order).toBe('desc');
    expect('sortDirection' in lastBody()).toBe(false);
  });

  test('an Any filter is left out entirely', async () => {
    reply([]);
    await runAction(findTodos, { completed: 'any', archived: 'any' });
    expect('completed' in lastBody()).toBe(false);
    expect('archived' in lastBody()).toBe(false);
  });

  test('an empty owner selection is omitted rather than sent as an empty array', async () => {
    reply([]);
    await runAction(findTodos, { userIds: [] });
    expect('userIds' in lastBody()).toBe(false);
  });

  test('the result carries the page, its size and the overall total', async () => {
    reply([{ id: 't1' }, { id: 't2' }]);
    const result = await runAction(findTodos, {});
    expect(result).toEqual({
      todos: [{ id: 't1' }, { id: 't2' }],
      count: 2,
      totalCount: 2,
    });
  });
});

describe('find issues', () => {
  test('issues page with the zero-based pageIndex and uppercase direction', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findIssues, {
      pageIndex: 0,
      sortField: 'createdDate',
      sortDirection: 'DESC',
    });
    expect(lastBody().pageIndex).toBe(0);
    expect(lastBody().sortDirection).toBe('DESC');
    expect('page' in lastBody()).toBe(false);
    expect('order' in lastBody()).toBe(false);
  });

  test('the term filter is sent as intervalCode, which is what query takes', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findIssues, { intervalCode: 'SHORT_TERM' });
    expect(lastBody().intervalCode).toBe('SHORT_TERM');
    expect('interval' in lastBody()).toBe(false);
  });
});

describe('find rocks', () => {
  test('rocks are searched through the paged endpoint', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findRocks, {});
    expect(lastUrl()).toBe('https://api.public.ninety.io/v1/rocks/query/paged');
  });

  test('an archived filter of No is sent as false rather than omitted', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findRocks, { archived: 'no' });
    expect(lastBody().archived).toBe(false);
  });
});

describe('the HTTP verb each action sends, so a PATCH cannot silently become a POST', () => {
  test('create to-do is a POST', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, { title: 'x' });
    expect(lastMethod()).toBe('POST');
  });

  test('update to-do is a PATCH', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, { todoId: 't1', title: 'x' });
    expect(lastMethod()).toBe('PATCH');
  });

  test('find to-dos queries with a POST', async () => {
    reply([]);
    await runAction(findTodos, {});
    expect(lastMethod()).toBe('POST');
  });

  test('create issue is a POST', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, { title: 'x', teamId: 't1' });
    expect(lastMethod()).toBe('POST');
  });

  test('update issue is a PATCH', async () => {
    reply({ id: 'i1' });
    await runAction(updateIssue, { issueId: 'i1', title: 'x' });
    expect(lastMethod()).toBe('PATCH');
  });

  test('find issues queries with a POST', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findIssues, {});
    expect(lastMethod()).toBe('POST');
  });

  test('create rock is a POST', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      title: 'x',
      teamId: 't1',
      dueDate: '2026-09-30T00:00:00.000Z',
      statusCode: 'ON_TRACK',
      levelCode: 'USER',
      quarter: 'Q3',
    });
    expect(lastMethod()).toBe('POST');
  });

  test('update rock is a PATCH', async () => {
    reply({ _id: 'r1' });
    await runAction(updateRock, { rockId: 'r1', title: 'x' });
    expect(lastMethod()).toBe('PATCH');
  });

  test('find rocks queries with a POST', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findRocks, {});
    expect(lastMethod()).toBe('POST');
  });

  test('create milestone is a POST', async () => {
    reply({ _id: 'm1' });
    await runAction(createMilestone, {
      teamId: 't1',
      rockId: 'r1',
      title: 'x',
      dueDate: '2026-09-12T00:00:00.000Z',
    });
    expect(lastMethod()).toBe('POST');
  });

  test('find measurables queries with a POST', async () => {
    reply({ items: [], totalCount: 0 });
    await runAction(findMeasurables, {});
    expect(lastMethod()).toBe('POST');
  });

  test('list teams is a GET', async () => {
    reply([]);
    await runAction(listTeams, {});
    expect(lastMethod()).toBe('GET');
  });

  test('set measurable score is a POST', async () => {
    reply({});
    await runAction(setMeasurableScore, {
      measurableId: 'k1',
      value: 1,
      periodStartDate: '2026-09-07',
    });
    expect(lastMethod()).toBe('POST');
  });
});

describe('every optional field lands in the body, so none is silently dropped', () => {
  test('create to-do sends every field it was given', async () => {
    reply({ id: 't1' });
    await runAction(createTodo, {
      title: 'x',
      teamId: 'team-1',
      userId: 'user-1',
      dueDate: '2026-09-11T00:00:00.000Z',
      description: 'desc',
      repeat: 'weekly',
    });
    expect(lastBody()).toEqual({
      title: 'x',
      teamId: 'team-1',
      userId: 'user-1',
      dueDate: '2026-09-11',
      description: 'desc',
      repeat: 'weekly',
    });
  });

  test('update to-do sends every field it was given', async () => {
    reply({ id: 't1' });
    await runAction(updateTodo, {
      todoId: 't1',
      title: 'x',
      description: 'desc',
      dueDate: '2026-09-11T00:00:00.000Z',
      teamId: 'team-1',
      userId: 'user-1',
      completed: 'yes',
      archived: 'yes',
      repeat: 'weekly',
    });
    expect(lastBody()).toEqual({
      title: 'x',
      description: 'desc',
      dueDate: '2026-09-11',
      teamId: 'team-1',
      userId: 'user-1',
      completed: true,
      archived: true,
      repeat: 'weekly',
    });
  });

  test('create issue sends every field it was given', async () => {
    reply({ id: 'i1' });
    await runAction(createIssue, {
      title: 'x',
      teamId: 'team-1',
      interval: 'LONG_TERM',
      priority: '3',
      userId: 'user-1',
      description: 'desc',
    });
    expect(lastBody()).toEqual({
      title: 'x',
      teamId: 'team-1',
      interval: 'LONG_TERM',
      priority: 3,
      userId: 'user-1',
      description: 'desc',
    });
  });

  test('update issue sends every field it was given', async () => {
    reply({ id: 'i1' });
    await runAction(updateIssue, {
      issueId: 'i1',
      title: 'x',
      teamId: 'team-1',
      interval: 'LONG_TERM',
      priority: '3',
      completed: 'yes',
      description: 'desc',
    });
    expect(lastBody()).toEqual({
      title: 'x',
      teamId: 'team-1',
      interval: 'LONG_TERM',
      priority: 3,
      completed: true,
      description: 'desc',
    });
  });

  test('create rock sends every field it was given', async () => {
    reply({ _id: 'r1' });
    await runAction(createRock, {
      title: 'x',
      teamId: 'team-1',
      dueDate: '2026-09-30T00:00:00.000Z',
      statusCode: 'ON_TRACK',
      levelCode: 'USER',
      quarter: 'Q3',
      description: 'desc',
      futureScope: 'Current',
      additionalTeamIds: ['t2'],
      addCreatorToFollowersList: true,
    });
    expect(lastBody()).toEqual({
      rock: {
        title: 'x',
        teamId: 'team-1',
        dueDate: '2026-09-30T00:00:00.000Z',
        statusCode: 'ON_TRACK',
        levelCode: 'USER',
        quarter: 'Q3',
        description: 'desc',
        futureScope: 'Current',
        additionalTeamIds: ['t2'],
      },
      addCreatorToFollowersList: true,
    });
  });

  test('update rock sends every field it was given, including the status', async () => {
    reply({ _id: 'r1' });
    await runAction(updateRock, {
      rockId: 'r1',
      title: 'x',
      statusCode: 'DONE',
      levelCode: 'COMPANY',
      quarter: 'Q4',
      dueDate: '2026-09-30T17:30:00.000Z',
      teamId: 'team-1',
      userId: 'user-1',
      description: 'desc',
      futureScope: 'Next',
      additionalTeamIds: ['t2'],
      archived: 'yes',
    });
    expect(lastBody()).toEqual({
      title: 'x',
      statusCode: 'DONE',
      levelCode: 'COMPANY',
      quarter: 'Q4',
      dueDate: '2026-09-30T17:30:00.000Z',
      teamId: 'team-1',
      userId: 'user-1',
      description: 'desc',
      futureScope: 'Next',
      additionalTeamIds: ['t2'],
      archived: true,
    });
  });
});
