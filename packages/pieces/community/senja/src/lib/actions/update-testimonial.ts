import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { senjaAuth } from '../../';
import { senjaApiCall, mapTestimonial } from '../common';

export const updateTestimonialAction = createAction({
  auth: senjaAuth,
  name: 'update_testimonial',
  displayName: 'Update Testimonial',
  description: 'Approve, unapprove, or update tags on an existing testimonial.',
  props: {
    id: Property.ShortText({
      displayName: 'Testimonial ID',
      description:
        'The unique ID of the testimonial. You can find it in the URL when viewing a testimonial in Senja, or from the output of a "List Testimonials" step.',
      required: true,
    }),
    approved: Property.StaticDropdown({
      displayName: 'Approval Status',
      description:
        'Set to "Approved" to publish the testimonial, or "Pending" to unpublish it. Leave empty to keep the current status.',
      required: false,
      options: {
        options: [
          { label: 'Approved', value: 'true' },
          { label: 'Pending', value: 'false' },
        ],
      },
    }),
    add_tags: Property.Array({
      displayName: 'Add Tags',
      description:
        'Tag names to add to this testimonial. Tags are created automatically if they do not already exist.',
      required: false,
    }),
    remove_tags: Property.Array({
      displayName: 'Remove Tags',
      description: 'Tag names to remove from this testimonial.',
      required: false,
    }),
  },
  async run(context) {
    const { id, approved, add_tags, remove_tags } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (approved !== undefined && approved !== null)
      body['approved'] = approved === 'true';
    if (add_tags && Array.isArray(add_tags) && add_tags.length > 0)
      body['add_tags'] = add_tags;
    if (remove_tags && Array.isArray(remove_tags) && remove_tags.length > 0)
      body['remove_tags'] = remove_tags;

    if (Object.keys(body).length === 0) {
      throw new Error(
        'At least one field must be provided: Approval Status, Add Tags, or Remove Tags.',
      );
    }

    const response = await senjaApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/testimonials/${id}`,
      body,
    });

    return mapTestimonial({ testimonial: response.body });
  },
});
