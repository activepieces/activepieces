import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall } from '../common';

export const deleteTestimonialAction = createAction({
  auth: senjaAuth,
  name: 'delete_testimonial',
  displayName: 'Delete Testimonial',
  description: 'Permanently delete a testimonial from your Senja project. This action cannot be undone.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a Senja testimonial by its ID; this cannot be undone. Use only when you intend to remove a testimonial for good. Requires the testimonial ID. Not idempotent — the testimonial exists only on the first successful call and a repeat targets a missing resource.', idempotent: false },
  props: {
    id: Property.ShortText({
      displayName: 'Testimonial ID',
      description:
        'The unique ID of the testimonial to delete. You can find it in the URL when viewing a testimonial in Senja, or from the output of a "List Testimonials" step.',
      required: true,
    }),
  },
  async run(context) {
    const response = await senjaApiCall<{ message: string }>({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/testimonials/${context.propsValue.id}`,
    });

    return { message: response.body.message };
  },
});
