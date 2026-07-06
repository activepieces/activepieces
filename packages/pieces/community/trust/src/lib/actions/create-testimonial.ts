import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const createTestimonialAction = createAction({
  auth: trustAuth,
  name: 'create_testimonial',
  displayName: 'Create Testimonial',
  description: 'Creates a new testimonial in the system.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new testimonial in the Trust workspace with author details (name, email, job title, company), text and/or video content, a 1-5 star rating, plus published and consent flags. Pick this to add a fresh testimonial; media must already be hosted (pass URLs or embed HTML — upload files first via the upload actions). Each call creates a new testimonial, so retries produce duplicates (not idempotent).',
    idempotent: false,
  },
  props: {
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
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      description: "The testimonial author's job title (e.g. CEO, Marketing Manager).",
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
      description: 'The written testimonial content.',
      required: false,
    }),
    stars: Property.Number({
      displayName: 'Star Rating',
      description: 'Rating from 1 to 5.',
      required: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Profile Image URL',
      description: 'URL of the author profile image.',
      required: false,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'URL of the testimonial video.',
      required: false,
    }),
    externalVideoHtml: Property.LongText({
      displayName: 'External Video HTML',
      description: 'Embed HTML for an external video (e.g. YouTube or Vimeo embed code).',
      required: false,
    }),
    published: Property.Checkbox({
      displayName: 'Published',
      description: 'Whether this testimonial is publicly visible.',
      required: false,
      defaultValue: false,
    }),
    gaveConsent: Property.Checkbox({
      displayName: 'Gave Consent',
      description: 'Whether the author gave consent to publish this testimonial.',
      required: false,
      defaultValue: false,
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

    if (p.firstname) body['firstname'] = p.firstname;
    if (p.lastname) body['lastname'] = p.lastname;
    if (p.email) body['email'] = p.email;
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
      method: HttpMethod.POST,
      path: '/testimonial',
      body,
    });
    return response.body;
  },
});
