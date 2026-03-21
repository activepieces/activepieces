import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall } from '../common';

export const testimonialEventTrigger = createTrigger({
  auth: senjaAuth,
  name: 'testimonial_event',
  displayName: 'Testimonial Event',
  description: 'Triggers when a testimonial is created, updated, or deleted in Senja.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. After activating this flow, copy the **Webhook URL** shown below.
2. In Senja, go to **Automate** (or **Settings > Webhooks**).
3. Create a new webhook and paste the URL.
4. Select which events you want Senja to send (created, updated, deleted).
5. Save — your flow will now trigger automatically.`,
    }),
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Filter Events',
      description:
        'Only trigger for the selected event types. Leave empty to trigger on all events. Make sure the matching events are enabled in Senja.',
      required: false,
      options: {
        options: [
          { label: 'Testimonial Created', value: 'created' },
          { label: 'Testimonial Updated', value: 'updated' },
          { label: 'Testimonial Deleted', value: 'deleted' },
        ],
      },
    }),
  },
  sampleData: {
    event: 'created',
    id: 'abc123',
    type: 'text',
    title: 'Great product!',
    text: 'I love using this tool every day.',
    rating: 5,
    approved: true,
    date: '2024-01-15T10:00:00Z',
    integration: 'google',
    tags: 'happy-customer, enterprise',
    lang: 'en',
    video_url: null,
    thumbnail_url: null,
    form_id: null,
    customer_name: 'Jane Doe',
    customer_email: 'jane@example.com',
    customer_company: 'Acme Inc',
    customer_tagline: 'CEO at Acme',
    customer_username: null,
    customer_url: null,
    customer_avatar: null,
    customer_company_logo: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Senja does not provide a programmatic webhook registration API.
    // The user must manually add the webhook URL in the Senja dashboard.
  },

  async onDisable(_context) {
    // Nothing to clean up — webhook is managed manually in Senja.
  },

  async run(context) {
    const payload = context.payload.body as Record<string, unknown>;

    const selectedEvents = context.propsValue.events as string[] | undefined;
    if (selectedEvents && selectedEvents.length > 0) {
      const eventType = (payload['event'] as string) ?? null;
      if (!eventType || !selectedEvents.includes(eventType)) {
        return [];
      }
    }

    const t = (payload['testimonial'] as Record<string, unknown>) ?? payload;

    return [
      {
        event: payload['event'] ?? null,
        id: t['id'] ?? null,
        type: t['type'] ?? null,
        title: t['title'] ?? null,
        text: t['text'] ?? null,
        rating: t['rating'] ?? null,
        url: t['url'] ?? null,
        date: t['date'] ?? null,
        approved: t['approved'] ?? null,
        integration: t['integration'] ?? null,
        tags: Array.isArray(t['tags'])
          ? (t['tags'] as string[]).join(', ')
          : (t['tags'] ?? null),
        lang: t['lang'] ?? null,
        video_url: t['video_url'] ?? null,
        thumbnail_url: t['thumbnail_url'] ?? null,
        form_id: t['form_id'] ?? null,
        customer_name: (t['customer'] as Record<string, unknown>)?.['name'] ?? null,
        customer_email: (t['customer'] as Record<string, unknown>)?.['email'] ?? null,
        customer_company: (t['customer'] as Record<string, unknown>)?.['company'] ?? null,
        customer_tagline: (t['customer'] as Record<string, unknown>)?.['tagline'] ?? null,
        customer_username: (t['customer'] as Record<string, unknown>)?.['username'] ?? null,
        customer_url: (t['customer'] as Record<string, unknown>)?.['url'] ?? null,
        customer_avatar: (t['customer'] as Record<string, unknown>)?.['avatar'] ?? null,
        customer_company_logo:
          (t['customer'] as Record<string, unknown>)?.['company_logo'] ?? null,
        created_at: t['created_at'] ?? null,
        updated_at: t['updated_at'] ?? null,
      },
    ];
  },

  async test(context) {
    const response = await senjaApiCall<unknown>({
      token: context.auth as string,
      method: HttpMethod.GET,
      path: '/testimonials',
      queryParams: { limit: '5', sort: 'date', order: 'desc' },
    });

    const items = Array.isArray(response.body)
      ? (response.body as Record<string, unknown>[])
      : ((response.body as { data?: Record<string, unknown>[] })?.['data'] ?? []);

    return items.map((t) => ({
      event: 'created',
      id: t['id'] ?? null,
      type: t['type'] ?? null,
      title: t['title'] ?? null,
      text: t['text'] ?? null,
      rating: t['rating'] ?? null,
      url: t['url'] ?? null,
      date: t['date'] ?? null,
      approved: t['approved'] ?? null,
      integration: t['integration'] ?? null,
      tags: Array.isArray(t['tags'])
        ? (t['tags'] as string[]).join(', ')
        : (t['tags'] ?? null),
      lang: t['lang'] ?? null,
      video_url: t['video_url'] ?? null,
      thumbnail_url: t['thumbnail_url'] ?? null,
      form_id: t['form_id'] ?? null,
      customer_name: (t['customer'] as Record<string, unknown>)?.['name'] ?? null,
      customer_email: (t['customer'] as Record<string, unknown>)?.['email'] ?? null,
      customer_company: (t['customer'] as Record<string, unknown>)?.['company'] ?? null,
      customer_tagline: (t['customer'] as Record<string, unknown>)?.['tagline'] ?? null,
      customer_username: (t['customer'] as Record<string, unknown>)?.['username'] ?? null,
      customer_url: (t['customer'] as Record<string, unknown>)?.['url'] ?? null,
      customer_avatar: (t['customer'] as Record<string, unknown>)?.['avatar'] ?? null,
      customer_company_logo:
        (t['customer'] as Record<string, unknown>)?.['company_logo'] ?? null,
      created_at: t['created_at'] ?? null,
      updated_at: t['updated_at'] ?? null,
    }));
  },
});
