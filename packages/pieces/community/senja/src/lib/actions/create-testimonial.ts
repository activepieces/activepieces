import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall, INTEGRATION_OPTIONS } from '../common';

export const createTestimonialAction = createAction({
  auth: senjaAuth,
  name: 'create_testimonial',
  displayName: 'Create Testimonial',
  description: 'Add a new testimonial to your Senja project.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Testimonial Type',
      description:
        'Choose "Text" for a written testimonial or "Video" for a video testimonial.',
      required: true,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Full name of the person giving the testimonial.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'A short headline for the testimonial.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Testimonial Text',
      description:
        'The body of the testimonial. Required for text testimonials.',
      required: false,
    }),
    rating: Property.Number({
      displayName: 'Rating',
      description: 'Star rating from 1 (lowest) to 5 (highest).',
      required: false,
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
      description:
        'Check to mark the testimonial as approved immediately. Leave unchecked to keep it pending.',
      required: false,
      defaultValue: false,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description:
        "Date the testimonial was given. Leave empty to use today's date.",
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Source URL',
      description:
        'Link to the original testimonial (e.g. a tweet URL, Google review link).',
      required: false,
    }),
    video_url: Property.ShortText({
      displayName: 'Video URL',
      description:
        'URL of the video testimonial. Required when Testimonial Type is "Video".',
      required: false,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email address of the customer.',
      required: false,
    }),
    customer_company: Property.ShortText({
      displayName: 'Customer Company',
      description: 'Company or organisation the customer belongs to.',
      required: false,
    }),
    customer_tagline: Property.ShortText({
      displayName: 'Customer Tagline',
      description:
        'Short role or tagline for the customer (e.g. "CEO at Acme").',
      required: false,
    }),
    customer_username: Property.ShortText({
      displayName: 'Customer Username',
      description:
        'Social media handle or username of the customer (e.g. "@johndoe").',
      required: false,
    }),
    customer_url: Property.ShortText({
      displayName: 'Customer Profile URL',
      description: "Link to the customer's social profile or website.",
      required: false,
    }),
    customer_avatar: Property.ShortText({
      displayName: 'Customer Avatar URL',
      description: "Direct URL to the customer's profile picture.",
      required: false,
    }),
    customer_company_logo: Property.ShortText({
      displayName: 'Company Logo URL',
      description: "Direct URL to the customer's company logo.",
      required: false,
    }),
    integration: Property.StaticDropdown({
      displayName: 'Source / Integration',
      description: 'The platform where this testimonial originally came from.',
      required: false,
      options: {
        options: INTEGRATION_OPTIONS,
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Tags to attach to this testimonial for organisation and filtering.',
      required: false,
    }),
    thumbnail_url: Property.ShortText({
      displayName: 'Thumbnail URL',
      description: 'URL of the thumbnail image for this testimonial.',
      required: false,
    }),
    form_id: Property.ShortText({
      displayName: 'Form ID',
      description: 'ID of the Senja form to associate this testimonial with.',
      required: false,
    }),
  },
  async run(context) {
    const {
      type,
      customer_name,
      title,
      text,
      rating,
      approved,
      date,
      url,
      video_url,
      customer_email,
      customer_company,
      customer_tagline,
      customer_username,
      customer_url,
      customer_avatar,
      customer_company_logo,
      integration,
      tags,
      thumbnail_url,
      form_id,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      type,
      customer_name,
    };

    if (title) body['title'] = title;
    if (text) body['text'] = text;
    if (rating !== undefined && rating !== null) body['rating'] = rating;
    if (approved !== undefined && approved !== null)
      body['approved'] = approved;
    if (date) body['date'] = date;
    if (url) body['url'] = url;
    if (video_url) body['video_url'] = video_url;
    if (customer_email) body['customer_email'] = customer_email;
    if (customer_company) body['customer_company'] = customer_company;
    if (customer_tagline) body['customer_tagline'] = customer_tagline;
    if (customer_username) body['customer_username'] = customer_username;
    if (customer_url) body['customer_url'] = customer_url;
    if (customer_avatar) body['customer_avatar'] = customer_avatar;
    if (customer_company_logo)
      body['customer_company_logo'] = customer_company_logo;
    if (integration) body['integration'] = integration;
    if (tags && Array.isArray(tags) && tags.length > 0) body['tags'] = tags;
    if (thumbnail_url) body['thumbnail_url'] = thumbnail_url;
    if (form_id) body['form_id'] = form_id;

    const response = await senjaApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/testimonials',
      body,
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
    };
  },
});
