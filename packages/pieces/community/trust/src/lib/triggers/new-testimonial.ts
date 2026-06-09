import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

type TestimonialItem = {
  id: string;
  created: string;
  [key: string]: unknown;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof trustAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const { props } = auth;
    const response = await trustApiRequest<TestimonialItem[]>({
      apiKey: props.api_key,
      method: HttpMethod.GET,
      path: `/testimonial/all/${props.workspace_id}`,
    });

    const items = Array.isArray(response.body) ? response.body : [];
    return items.map((item) => ({
      epochMilliSeconds: new Date(item.created).getTime(),
      data: item,
    }));
  },
};

export const newTestimonialTrigger = createTrigger({
  auth: trustAuth,
  name: 'new_testimonial',
  displayName: 'New Testimonial Created',
  description:
    'Triggers when a new testimonial is created in your Trust workspace.',
  props: {},
  sampleData: {
    id: 'testimonial_01abc123',
    workspaceId: 'workspace_01xyz789',
    created: '2024-01-15T10:30:00Z',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    title: 'CEO',
    company: 'Acme Corp',
    testimonialText: 'This product has transformed the way we work.',
    stars: 5,
    published: true,
    gaveConsent: true,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
