import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';
import { formatSnapshot } from '../common/snapshot';

export const navigate = createAction({
  auth: testmuaiAuth,
  name: 'navigate',
  displayName: 'Navigate',
  description:
    'Open a URL in the session and return a snapshot of the page\'s interactive elements.',
  audience: 'both',
  aiMetadata: {
    description:
      'Navigates the browser to a URL, then returns a fresh snapshot of the page as a numbered list of interactive elements (each with a ref). Use the returned refs with Click Element and Type Text. Requires a sessionId from Create Session. Not idempotent: it changes what page the browser is on.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The Session ID returned by Create Session.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL to open, including the scheme (e.g. https://example.com).',
      required: true,
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { sessionId, url } = context.propsValue;

    await testmuaiCommon.sessionRequest({
      auth,
      sessionId,
      method: HttpMethod.POST,
      path: '/url',
      body: { url },
    });

    const elements = await testmuaiCommon.snapshot({ auth, sessionId });

    return {
      sessionId,
      url,
      elements,
      snapshot: formatSnapshot(elements),
    };
  },
});
