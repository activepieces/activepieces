import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const findTestimonialAction = createAction({
  auth: trustAuth,
  name: 'find_testimonial',
  displayName: 'Find Testimonial',
  description: 'Finds a testimonial by ID.',
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
