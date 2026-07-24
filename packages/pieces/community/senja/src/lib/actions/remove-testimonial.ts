import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall } from '../common';

export const removeTestimonialAction = createAction({
  auth: senjaAuth,
  name: 'remove_testimonial',
  displayName: 'Remove Testimonial',
  description: 'Permanently delete a testimonial from your Senja project. This action cannot be undone.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a Senja testimonial by ID; this cannot be undone and there is no archive or recovery. Use only when removal is explicitly intended. Requires the testimonial ID (resolve via Find Testimonials). Destructive — a repeat call targets a now-missing record and returns 404.', idempotent: false },
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
