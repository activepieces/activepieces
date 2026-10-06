import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { organizationOutputSchema } from '../output-schemas';

export const getOrganizationAction = createAction({
  auth: calendlyAuth,
  name: 'get_organization',
  classification: 'READ',
  displayName: 'Get Organization',
  description: 'Gets a Calendly organization, including its plan.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Get a Calendly organization's name, plan (basic, standard, teams, enterprise...) and stage (free, trial, paid). Leave Organization empty for the connected user's organization. Use it to check whether plan-gated features are available. Read-only.",
    idempotent: true,
  },
  outputSchema: organizationOutputSchema,
  props: {
    organization: calendlyCommon.organization,
  },
  async run({ auth, propsValue }) {
    const organization = await calendlyCommon.resolveOrganizationUri({
      token: auth.secret_text,
      organization: propsValue.organization,
    });
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/organizations/${calendlyCommon.toUuid({ value: organization })}`,
    });
    return response.resource;
  },
});
