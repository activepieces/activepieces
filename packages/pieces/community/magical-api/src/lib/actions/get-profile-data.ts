import { createAction, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { runJob, normalizeRequestId } from '../common/poll';
import { profileDataOutputSchema } from '../common/output-schemas';

export const getProfileData = createAction({
  auth: magicalApiAuth,
  name: 'get_profile_data',
  classification: 'READ',
  displayName: 'Get Profile Data',
  description: 'Given a LinkedIn profile username, retrieve comprehensive profile data.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves public LinkedIn profile data (name, bio, location, experience, education, certifications, languages, skills-related sections) for a profile username: the slug after /in/ in the profile URL, e.g. "williamhgates". A full linkedin.com/in/ URL is also accepted and reduced to its slug; a display name is not. Use to enrich a person record. Each new lookup costs about 150 MagicalAPI credits. Either supply the username, or pass the Request ID from a prior timed-out run to fetch that result; the call polls up to 60 seconds. Idempotent: a read-only lookup (but every new lookup spends credits).',
    idempotent: true,
  },
  props: {
    profile_name: Property.ShortText({
      displayName: 'LinkedIn Profile Username',
      description: "Provide the username from the LinkedIn profile URL (e.g., 'williamhgates').",
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID (for retries)',
      description: 'If a previous run timed out, paste the Request ID here to get the result.',
      required: false,
    }),
  },
  outputSchema: profileDataOutputSchema,
  async run(context) {
    const { profile_name, request_id: rawRequestId } = context.propsValue;
    const request_id = normalizeRequestId(rawRequestId);
    const slug = profile_name ? toProfileSlug(profile_name) : '';
    if (!request_id && !slug) {
      throw new Error('To start a new request, you must provide a LinkedIn Profile Username.');
    }
    return runJob({
      apiKey: context.auth.secret_text,
      service: 'profile_data',
      input: { profile_name: slug },
      requestId: request_id,
    });
  },
});

export function toProfileSlug(value: string): string {
  const trimmed = value.trim();
  const match = /linkedin\.com\/in\/([^/?#]+)/i.exec(trimmed);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return trimmed.replace(/^@/, '').replace(/\/+$/, '');
}
