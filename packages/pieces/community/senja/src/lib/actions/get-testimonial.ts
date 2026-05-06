import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall, mapTestimonial } from '../common';

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
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/testimonials/${context.propsValue.id}`,
    });

    return mapTestimonial({ testimonial: response.body });
  },
});
