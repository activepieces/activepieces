import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall } from '../common';

export const testimonialEventTrigger = createTrigger({
  auth: senjaAuth,
  name: 'testimonial_event',
  displayName: 'Testimonial Event',
  description:
    'Triggers when a testimonial is created, updated, or deleted in Senja.',
  props: {
    instructions: Property.MarkDown({
      value: `## Setup Instructions

1. In Senja, go to **Automate** in the left sidebar and scroll down to the Webhooks section.
2. Click **Create webhook**.
3. Paste the following URL into the webhook URL field:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Select the events you want to receive and click **Save**.`,
      variant: MarkdownVariant.INFO,
    }),
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Filter Events',
      description:
        'Only trigger for the selected event types. Leave empty to trigger on all events. Make sure the matching events are enabled in Senja.',
      required: false,
      options: {
        options: [
          { label: 'Testimonial Created', value: 'testimonial_created' },
          { label: 'Testimonial Updated', value: 'testimonial_updated' },
          { label: 'Testimonial Deleted', value: 'testimonial_deleted' },
        ],
      },
    }),
  },
  sampleData: {
    event_type: 'testimonial_created',
    id: 'rev_1234567890abcdef',
    type: 'text',
    title: 'Amazing product experience!',
    text: 'This product has completely transformed how we handle our workflow.',
    rating: 5,
    approved: true,
    date: '2024-01-15T10:30:00Z',
    url: 'https://google.com/reviews/123',
    integration: 'google',
    tags: ['featured', 'enterprise'],
    lang: null,
    video_url: null,
    thumbnail_url: 'https://cdn.senja.io/optimized/thumbnail.jpg',
    form_id: '3b5d354-6556-4f88-b29a-99e9552ca906',
    project_id: '7db5d354-6556-4f88-b29a-99e9552ca906',
    customer_name: 'Sarah Johnson',
    customer_email: 'sarah.johnson@example.com',
    customer_company: 'Tech Solutions Inc',
    customer_tagline: 'Senior Product Manager',
    customer_username: null,
    customer_url: null,
    customer_avatar: 'https://cdn.senja.io/optimized/avatar1.jpg',
    customer_company_logo: 'https://cdn.senja.io/optimized/company-logo1.png',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Senja does not provide a programmatic webhook registration API.
    // The user must manually add the webhook URL in the Senja dashboard (Automate tab).
  },

  async onDisable(_context) {
    // Nothing to clean up — webhook is managed manually in Senja.
  },

  async run(context) {
    // Senja payload shape:
    //   { type: "testimonial_created", data: { new: { ...testimonial } } }
    //   { type: "testimonial_updated", data: { old: { ... }, new: { ...testimonial } } }
    //   { type: "testimonial_deleted", data: { old: { ...testimonial } } }
    const payload = context.payload.body as Record<string, unknown>;
    const eventType = payload['type'] as string | undefined;

    const selectedEvents = context.propsValue.events as string[] | undefined;
    if (selectedEvents && selectedEvents.length > 0) {
      if (!eventType || !selectedEvents.includes(eventType)) {
        return [];
      }
    }

    const data = payload['data'] as Record<string, unknown> | undefined;
    const t =
      (eventType === 'testimonial_deleted'
        ? (data?.['old'] as Record<string, unknown>)
        : (data?.['new'] as Record<string, unknown>)) ??
      data ??
      payload;

    return [
      {
        event_type: eventType ?? null,
        id: t['id'] ?? null,
        type: t['type'] ?? null,
        title: t['title'] ?? null,
        text: t['text'] ?? null,
        rating: t['rating'] ?? null,
        url: t['url'] ?? null,
        date: t['date'] ?? null,
        approved: t['approved'] ?? null,
        integration: t['integration'] ?? null,
        tags: (t['tags'] as string[]) ?? [],
        lang: t['lang'] ?? null,
        video_url: t['video_url'] ?? null,
        thumbnail_url: t['thumbnail_url'] ?? null,
        form_id: t['form_id'] ?? null,
        project_id: t['project_id'] ?? null,
        customer_name: t['customer_name'] ?? null,
        customer_email: t['customer_email'] ?? null,
        customer_company: t['customer_company'] ?? null,
        customer_tagline: t['customer_tagline'] ?? null,
        customer_username: t['customer_username'] ?? null,
        customer_url: t['customer_url'] ?? null,
        customer_avatar: t['customer_avatar'] ?? null,
        customer_company_logo: t['customer_company_logo'] ?? null,
        created_at: t['created_at'] ?? null,
        updated_at: t['updated_at'] ?? null,
      },
    ];
  },

  async test(context) {
    const response = await senjaApiCall<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/testimonials',
      queryParams: { limit: '5', sort: 'date', order: 'desc' },
    });

    const items = (response.body as { testimonials?: Record<string, unknown>[] }).testimonials ?? [];

    return items.map((t) => ({
      event_type: 'testimonial_created',
      id: t['id'] ?? null,
      type: t['type'] ?? null,
      title: t['title'] ?? null,
      text: t['text'] ?? null,
      rating: t['rating'] ?? null,
      url: t['url'] ?? null,
      date: t['date'] ?? null,
      approved: t['approved'] ?? null,
      integration: t['integration'] ?? null,
      tags: (t['tags'] as string[]) ?? [],
      lang: t['lang'] ?? null,
      video_url: t['video_url'] ?? null,
      thumbnail_url: t['thumbnail_url'] ?? null,
      form_id: t['form_id'] ?? null,
      project_id: t['project_id'] ?? null,
      customer_name: t['customer_name'] ?? null,
      customer_email: t['customer_email'] ?? null,
      customer_company: t['customer_company'] ?? null,
      customer_tagline: t['customer_tagline'] ?? null,
      customer_username: t['customer_username'] ?? null,
      customer_url: t['customer_url'] ?? null,
      customer_avatar: t['customer_avatar'] ?? null,
      customer_company_logo: t['customer_company_logo'] ?? null,
      created_at: t['created_at'] ?? null,
      updated_at: t['updated_at'] ?? null,
    }));
  },
});
