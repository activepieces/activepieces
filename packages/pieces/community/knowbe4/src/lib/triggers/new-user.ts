import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

interface KnowBe4User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  status: string;
  joined_on: string;
  groups: number[];
  current_risk_score: number;
  phish_prone_percentage: number;
}

export const newUser = createTrigger({
  auth: knowbe4Auth,
  name: 'new_user',
  displayName: 'New User',
  description: 'Triggers when a new user is added to your KnowBe4 account',
  props: {},
  sampleData: {
    id: 12345,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    job_title: 'Software Engineer',
    status: 'active',
    joined_on: '2026-01-01T00:00:00.000Z',
    groups: [1, 2],
    current_risk_score: 42.5,
    phish_prone_percentage: 15.5,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('knownUserIds', JSON.stringify([]));

    const users = await knowbe4ApiRequest<KnowBe4User[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/users',
      queryParams: { status: 'active', per_page: '500' },
    });

    const ids = users.map((u) => u.id);
    await context.store.put('knownUserIds', JSON.stringify(ids));
  },
  async onDisable(context) {
    await context.store.delete('knownUserIds');
  },
  async run(context) {
    const knownIdsStr =
      (await context.store.get<string>('knownUserIds')) ?? '[]';
    const knownIds: number[] = JSON.parse(knownIdsStr);
    const knownSet = new Set(knownIds);

    const users = await knowbe4ApiRequest<KnowBe4User[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/users',
      queryParams: { status: 'active', per_page: '500' },
    });

    const newUsers = users.filter((u) => !knownSet.has(u.id));

    if (newUsers.length > 0) {
      const allIds = users.map((u) => u.id);
      await context.store.put('knownUserIds', JSON.stringify(allIds));
    }

    return newUsers;
  },
  async test(context) {
    const users = await knowbe4ApiRequest<KnowBe4User[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/users',
      queryParams: { status: 'active', per_page: '5' },
    });

    return users;
  },
});
