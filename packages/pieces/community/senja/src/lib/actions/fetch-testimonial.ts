import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall, mapTestimonial } from '../common';

export const fetchTestimonialAction = createAction({
  auth: senjaAuth,
  name: 'fetch_testimonial',
  displayName: 'Fetch Testimonial',
  description: 'Retrieve a specific testimonial by its ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one Senja testimonial\'s full details by its ID. Pick this over Find Testimonials when you already hold a specific testimonial ID (from Find Testimonials or the Testimonial Event trigger) and want only that record. Requires the testimonial ID; resolve unknown IDs via Find Testimonials first. Read-only.', idempotent: true },
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
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/testimonials/${context.propsValue.id}`,
    });

    return mapTestimonial({ testimonial: response.body });
  },
});
