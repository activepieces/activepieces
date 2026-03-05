import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

interface PostmarkBounce {
  ID: number;
  Type: string;
  TypeCode: number;
  Name: string;
  Email: string;
  BouncedAt: string;
  Inactive: boolean;
  Subject: string;
  MessageID: string;
  Tag: string;
  From: string;
  Description: string;
  MessageStream: string;
}

interface PostmarkBouncesResponse {
  TotalCount: number;
  Bounces: PostmarkBounce[];
}

export const newBounce = createTrigger({
  auth: postmarkAuth,
  name: 'new_bounce',
  displayName: 'New Bounce',
  description: 'Triggers when an email bounces',
  props: {},
  sampleData: {
    ID: 692560173,
    Type: 'HardBounce',
    TypeCode: 1,
    Name: 'Hard bounce',
    Email: 'user@example.com',
    BouncedAt: '2026-01-15T16:09:19-05:00',
    Inactive: true,
    Subject: 'Test Email',
    MessageID: '0a129aee-e1cd-480d-b08d-4f48548ff48d',
    Tag: '',
    From: 'sender@example.com',
    Description: 'The server was unable to deliver your message.',
    MessageStream: 'outbound',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const response =
      await postmarkApiRequest<PostmarkBouncesResponse>({
        apiKey: context.auth,
        method: HttpMethod.GET,
        endpoint: '/bounces',
        queryParams: { count: '1', offset: '0' },
      });

    const latestId =
      response.Bounces.length > 0 ? response.Bounces[0].ID : 0;
    await context.store.put('lastBounceId', String(latestId));
  },
  async onDisable(context) {
    await context.store.delete('lastBounceId');
  },
  async run(context) {
    const lastIdStr =
      (await context.store.get<string>('lastBounceId')) ?? '0';
    const lastId = parseInt(lastIdStr, 10);

    const response =
      await postmarkApiRequest<PostmarkBouncesResponse>({
        apiKey: context.auth,
        method: HttpMethod.GET,
        endpoint: '/bounces',
        queryParams: { count: '100', offset: '0' },
      });

    const newBounces = response.Bounces.filter(
      (b) => b.ID > lastId
    );

    if (newBounces.length > 0) {
      const maxId = Math.max(...newBounces.map((b) => b.ID));
      await context.store.put('lastBounceId', String(maxId));
    }

    return newBounces;
  },
  async test(context) {
    const response =
      await postmarkApiRequest<PostmarkBouncesResponse>({
        apiKey: context.auth,
        method: HttpMethod.GET,
        endpoint: '/bounces',
        queryParams: { count: '5', offset: '0' },
      });

    return response.Bounces;
  },
});
