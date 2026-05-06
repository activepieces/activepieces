import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall, INTEGRATION_OPTIONS } from '../common';

export const listTestimonialsAction = createAction({
  auth: senjaAuth,
  name: 'list_testimonials',
  displayName: 'List Testimonials',
  description: 'Retrieve all testimonials from your Senja project.',
  props: {
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field used to sort the results.',
      required: false,
      defaultValue: 'date',
      options: {
        options: [
          { label: 'Date', value: 'date' },
          { label: 'Rating', value: 'rating' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Sort direction.',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Newest first (descending)', value: 'desc' },
          { label: 'Oldest first (ascending)', value: 'asc' },
        ],
      },
    }),
    approved: Property.StaticDropdown({
      displayName: 'Approval Status',
      description:
        'Filter by approval status. Leave empty to return all testimonials.',
      required: false,
      options: {
        options: [
          { label: 'Approved only', value: 'true' },
          { label: 'Pending only', value: 'false' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Testimonial Type',
      description:
        'Filter by testimonial type. Leave empty to return all types.',
      required: false,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    rating: Property.Number({
      displayName: 'Rating',
      description: 'Filter testimonials by star rating (1 to 5).',
      required: false,
    }),
    integration: Property.StaticDropdown({
      displayName: 'Source / Integration',
      description:
        'Filter testimonials by their source platform (e.g. Google, Twitter).',
      required: false,
      options: {
        options: INTEGRATION_OPTIONS,
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Filter testimonials that have all of the specified tags.',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description:
        'Filter by language using an ISO 639 code (e.g. "en", "fr", "de").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of testimonials to return (1–1000).',
      required: false,
      defaultValue: 100,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination. Start at 1.',
      required: false,
    }),
  },
  async run(context) {
    const {
      sort,
      order,
      approved,
      type,
      rating,
      integration,
      tags,
      lang,
      limit,
      page,
    } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (sort) queryParams['sort'] = sort;
    if (order) queryParams['order'] = order;
    if (approved !== undefined && approved !== null)
      queryParams['approved'] = approved;
    if (type) queryParams['type'] = type;
    if (rating !== undefined && rating !== null)
      queryParams['rating'] = String(rating);
    if (integration) queryParams['integration'] = integration;
    if (lang) queryParams['lang'] = lang;
    if (limit !== undefined && limit !== null)
      queryParams['limit'] = String(limit);
    if (page !== undefined && page !== null) queryParams['page'] = String(page);

    if (tags && Array.isArray(tags) && tags.length > 0) {
      (tags as string[]).forEach((tag, i) => {
        queryParams[`tags[${i}]`] = tag;
      });
    }

    const response = await senjaApiCall<{
      testimonials: Record<string, unknown>[];
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/testimonials',
      queryParams,
    });

    const testimonials = response.body.testimonials ?? [];

    return testimonials.map((t) => ({
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
