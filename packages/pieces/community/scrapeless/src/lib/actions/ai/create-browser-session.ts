import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const createBrowserSessionAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_create_browser_session',
  displayName: 'Create Browser Session',
  description: 'Starts a cloud Scraping Browser session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a cloud Scraping Browser session and returns its taskId, which Get Browser Session Live URL and the signal actions use. The session runs, and uses credits, until its TTL ends. Profile and extension ids come from List Browser Profiles and List Browser Extensions.',
    idempotent: false,
  },
  props: {
    sessionTtl: Property.Number({
      displayName: 'Session TTL (seconds)',
      description:
        'How long the session lives before the browser closes, 60 to 900 seconds. Defaults to 180.',
      required: false,
    }),
    sessionName: Property.ShortText({
      displayName: 'Session Name',
      description: 'A name to find the session by in the session history.',
      required: false,
    }),
    sessionRecording: Property.Checkbox({
      displayName: 'Record Session',
      description:
        'Record the session so it can be replayed from the session history.',
      required: false,
    }),
    proxyCountry: Property.ShortText({
      displayName: 'Proxy Country',
      description:
        'Two-letter proxy country code, e.g. "US". Defaults to "ANY".',
      required: false,
    }),
    proxyState: Property.ShortText({
      displayName: 'Proxy State',
      description:
        'State or province code within the proxy country, e.g. "CA".',
      required: false,
    }),
    proxyCity: Property.ShortText({
      displayName: 'Proxy City',
      description:
        'City within the proxy state, e.g. "los_angeles". Needs Proxy State.',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'A browser profile to reuse, from List Browser Profiles.',
      required: false,
    }),
    extensionIds: Property.ShortText({
      displayName: 'Extension IDs',
      description:
        'Comma-separated extension ids to load, from List Browser Extensions.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.proxyCity && !propsValue.proxyState) {
      throw new Error('Proxy City needs Proxy State.');
    }
    return await scrapelessApi.createBrowserSession({
      auth,
      options: {
        sessionTTL: String(propsValue.sessionTtl ?? 180),
        sessionName: propsValue.sessionName,
        sessionRecording: propsValue.sessionRecording ? 'true' : undefined,
        proxyCountry: propsValue.proxyCountry ?? 'ANY',
        proxyState: propsValue.proxyState,
        proxyCity: propsValue.proxyCity,
        profileId: propsValue.profileId,
        extensionIds: propsValue.extensionIds,
      },
    });
  },
});
