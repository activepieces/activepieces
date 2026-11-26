import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, isRecord } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiEnrichPersonAction = createAction({
  auth: apolloAuth,
  name: 'ai_enrich_person',
  classification: 'READ',
  displayName: 'Enrich Person',
  description: 'Get full details, including work email, for one person.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the full Apollo profile of one person (name, title, work email, LinkedIn, location, employer) identified by Apollo person ID, email, or LinkedIn URL, or by full name plus employer domain or company name. found=false when nothing matches. Costs 1 Apollo credit when data is found (0 when not found); revealing personal emails can cost more.',
    idempotent: true,
  },
  props: {
    person_id: aiProps.optionalId({ displayName: 'Person ID', description: 'Apollo person ID from Search People (field id).' }),
    email: aiProps.text({ displayName: 'Email', description: 'Email address of the person.', required: false }),
    linkedin_url: aiProps.text({ displayName: 'LinkedIn URL', description: 'LinkedIn profile URL of the person.', required: false }),
    name: aiProps.text({ displayName: 'Full Name', description: 'Full name; needs Employer Domain or Company Name too.', required: false }),
    domain: aiProps.text({ displayName: 'Employer Domain', description: 'Employer domain without "www.", e.g. apollo.io.', required: false }),
    organization_name: aiProps.text({ displayName: 'Company Name', description: 'Employer name.', required: false }),
    reveal_personal_emails: aiProps.yesNo({ displayName: 'Reveal Personal Emails', description: 'yes also returns personal emails (may use extra credits; never for EU people). Default no.' }),
  },
  outputSchema: apolloOutputSchemas.personEnrichment,
  async run({ propsValue, auth }) {
    const personId = apolloInputs.optionalText(propsValue.person_id);
    const email = apolloInputs.optionalText(propsValue.email);
    const linkedinUrl = apolloInputs.optionalText(propsValue.linkedin_url);
    const name = apolloInputs.optionalText(propsValue.name);
    const domain = apolloInputs.optionalText(propsValue.domain);
    const organizationName = apolloInputs.optionalText(propsValue.organization_name);
    const strong = personId !== undefined || email !== undefined || linkedinUrl !== undefined;
    if (!strong && !(name !== undefined && (domain !== undefined || organizationName !== undefined))) {
      throw new Error('Give a Person ID, Email or LinkedIn URL, or a Full Name together with an Employer Domain or Company Name.');
    }
    const body = await apolloRequests.matchPerson({
      apiKey: apiKeyOf(auth),
      query: {
        id: personId,
        email,
        linkedin_url: linkedinUrl,
        name,
        domain,
        organization_name: organizationName,
        reveal_personal_emails: apolloInputs.yesNoValue(propsValue.reveal_personal_emails) === true ? true : undefined,
      },
    });
    const person = isRecord(body['person']) && body['person']['id'] !== undefined ? body['person'] : null;
    return {
      found: person !== null,
      match_confidence: person !== null && typeof person['match_confidence'] === 'string' ? person['match_confidence'] : null,
      person: person === null ? null : apolloMappers.person(person),
    };
  },
});
