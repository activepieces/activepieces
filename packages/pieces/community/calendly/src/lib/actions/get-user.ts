import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { userOutputSchema } from '../output-schemas';

export const getUserAction = createAction({
  auth: calendlyAuth,
  name: 'get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Gets a Calendly user, or the connected user.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Get a Calendly user's profile: URI, name, email, scheduling URL, timezone and current organization URI. Leave User empty to get the connected account (who am I); the returned uri and current_organization are the User and Organization values other Calendly actions need. Read-only.",
    idempotent: true,
  },
  outputSchema: userOutputSchema,
  props: {
    user: Property.ShortText({
      displayName: 'User',
      description: 'User URI or UUID. Leave empty to get the connected user.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const path = calendlyCommon.isProvided(propsValue.user)
      ? `/users/${calendlyCommon.toUuid({ value: propsValue.user })}`
      : '/users/me';
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path,
    });
    return response.resource;
  },
});
