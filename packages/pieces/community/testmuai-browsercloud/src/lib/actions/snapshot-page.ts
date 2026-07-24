import { createAction, Property } from '@activepieces/pieces-framework';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';
import { formatSnapshot } from '../common/snapshot';

export const snapshotPage = createAction({
  auth: testmuaiAuth,
  name: 'snapshot_page',
  displayName: 'Snapshot Page',
  description:
    'Re-scan the current page and return its interactive elements, each with a numeric ref.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the current page as a numbered list of interactive elements (links, buttons, inputs, ...), each with a ref used by Click Element and Type Text. This is how you "look at" the page. Call it whenever you need to see the current state or after the page changes. Requires a sessionId. Idempotent and read-only.',
    idempotent: true,
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

    const elements = await testmuaiCommon.snapshot({ auth, sessionId });

    return {
      sessionId,
      elements,
      snapshot: formatSnapshot(elements),
    };
  },
});
