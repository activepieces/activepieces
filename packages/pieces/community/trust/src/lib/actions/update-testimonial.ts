import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const updateTestimonialAction = createAction({
  auth: trustAuth,
  name: 'update_testimonial',
  displayName: 'Update Testimonial',
  description: 'Updates an existing testimonial in the system.',
  props: {
    testimonialId: Property.ShortText({
      displayName: 'Testimonial ID',
      description: 'The ID of the testimonial to update.',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Required by the Trust API to identify the testimonial.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    subtitle: Property.ShortText({
      displayName: 'Subtitle',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    testimonialText: Property.LongText({
      displayName: 'Testimonial Text',
      required: false,
    }),
    stars: Property.Number({
      displayName: 'Star Rating',
      description: 'Rating from 1 to 5.',
      required: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Profile Image URL',
      required: false,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      required: false,
    }),
    externalVideoHtml: Property.LongText({
      displayName: 'External Video HTML',
      required: false,
    }),
    published: Property.Checkbox({
      displayName: 'Published',
      required: false,
    }),
    gaveConsent: Property.Checkbox({
      displayName: 'Gave Consent',
      required: false,
    }),
    consentDateTime: Property.DateTime({
      displayName: 'Consent Date & Time',
      required: false,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const p = context.propsValue;

    const body: Record<string, unknown> = {
      workspaceId: props.workspace_id,
    };

    body['email'] = p.email;
    if (p.firstname) body['firstname'] = p.firstname;
    if (p.lastname) body['lastname'] = p.lastname;
    if (p.title) body['title'] = p.title;
    if (p.subtitle) body['subtitle'] = p.subtitle;
    if (p.company) body['company'] = p.company;
    if (p.testimonialText) body['testimonialText'] = p.testimonialText;
    if (p.stars !== undefined && p.stars !== null) body['stars'] = p.stars;
    if (p.imageUrl) body['imageUrl'] = p.imageUrl;
    if (p.videoUrl) body['videoUrl'] = p.videoUrl;
    if (p.externalVideoHtml) body['externalVideoHtml'] = p.externalVideoHtml;
    if (p.published !== undefined) body['published'] = p.published;
    if (p.gaveConsent !== undefined) body['gaveConsent'] = p.gaveConsent;
    if (p.consentDateTime) body['consentDateTime'] = p.consentDateTime;

    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.PUT,
      path: `/testimonial/${p.testimonialId}`,
      body,
    });
    return response.body;
  },
});
