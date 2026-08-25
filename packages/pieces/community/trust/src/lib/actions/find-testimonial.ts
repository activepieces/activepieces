import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const findTestimonialAction = createAction({
  auth: trustAuth,
  name: 'find_testimonial',
  displayName: 'Find Testimonial',
  description: 'Finds a testimonial by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single Trust testimonial by its testimonial ID. Pick this to inspect a known testimonial before updating or deleting it; it requires the exact ID and cannot search by author email or text. Read-only and safe to retry (idempotent).',
    idempotent: true,
  },
  props: {
    testimonialId: Property.ShortText({
      displayName: 'Testimonial ID',
      description: 'The ID of the testimonial to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.GET,
      path: `/testimonial/${context.propsValue.testimonialId}`,
    });
    return response.body;
  },
});
