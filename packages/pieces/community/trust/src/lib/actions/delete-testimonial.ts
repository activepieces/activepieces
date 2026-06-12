import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const deleteTestimonialAction = createAction({
  auth: trustAuth,
  name: 'delete_testimonial',
  displayName: 'Delete Testimonial',
  description: 'Deletes a testimonial by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete a Trust testimonial identified by its testimonial ID. Pick this only for outright removal; to merely hide a testimonial from public view, use Update Testimonial and set published to false instead. Deleting by a fixed ID is idempotent in effect — repeats leave the same end state, though a second attempt may error because the testimonial is already gone.',
    idempotent: true,
  },
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
