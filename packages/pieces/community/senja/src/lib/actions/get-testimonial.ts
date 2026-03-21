import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall } from '../common';

export const getTestimonialAction = createAction({
  auth: senjaAuth,
  name: 'get_testimonial',
  displayName: 'Get Testimonial',
  description: 'Retrieve a specific testimonial by its ID.',
  props: {
    id: Property.ShortText({
      displayName: 'Testimonial ID',
      description:
        'The unique ID of the testimonial. You can find it in the URL when viewing a testimonial in Senja, or from the output of a "List Testimonials" step.',
      required: true,
    }),
  },
  async run(context) {
    const response = await senjaApiCall<Record<string, unknown>>({
      token: context.auth as string,
      method: HttpMethod.GET,
      path: `/testimonials/${context.propsValue.id}`,
    });

    const t = response.body;
    return {
      id: t['id'] ?? null,
      type: t['type'] ?? null,
      title: t['title'] ?? null,
      text: t['text'] ?? null,
      rating: t['rating'] ?? null,
      url: t['url'] ?? null,
      date: t['date'] ?? null,
      approved: t['approved'] ?? null,
      integration: t['integration'] ?? null,
      tags: Array.isArray(t['tags']) ? (t['tags'] as string[]).join(', ') : (t['tags'] ?? null),
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
      customer_company_logo: (t['customer'] as Record<string, unknown>)?.['company_logo'] ?? null,
      created_at: t['created_at'] ?? null,
      updated_at: t['updated_at'] ?? null,
    };
  },
});
