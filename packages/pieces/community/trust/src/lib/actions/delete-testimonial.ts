import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const deleteTestimonialAction = createAction({
  auth: trustAuth,
  name: 'delete_testimonial',
  displayName: 'Delete Testimonial',
  description: 'Deletes a testimonial by ID.',
  props: {
    testimonialId: Property.ShortText({
      displayName: 'Testimonial ID',
      description: 'The ID of the testimonial to delete.',
      required: true,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.DELETE,
      path: `/testimonial/${context.propsValue.testimonialId}`,
    });
    return response.body;
  },
});
