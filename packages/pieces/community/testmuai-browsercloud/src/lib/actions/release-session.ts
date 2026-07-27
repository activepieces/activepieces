import { createAction, Property } from '@activepieces/pieces-framework';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';

export const releaseSession = createAction({
  auth: testmuaiAuth,
  name: 'release_session',
  displayName: 'Release Session',
  description:
    'End a browser session and free its resources. Always run this when finished.',
  audience: 'both',
  aiMetadata: {
    description:
      'Ends the browser session and frees its resources. Always call this once you have finished with a session to avoid idle timeouts and wasted quota. Safe to call even if the session already ended. Requires a sessionId.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The Session ID returned by Create Session.',
      required: true,
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { sessionId } = context.propsValue;

    // The session may already be gone server-side (idle timeout or a duplicate
    // release) — treat that as success rather than failing the step.
    try {
      await testmuaiCommon.deleteSession({ auth, sessionId });
    } catch {
      // no-op
    }

    return {
      sessionId,
      released: true,
    };
  },
});
