import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';
import { ELEMENT_KEY } from '../common/constants';
import { refSelector, formatSnapshot } from '../common/snapshot';

export const clickElement = createAction({
  auth: testmuaiAuth,
  name: 'click_element',
  displayName: 'Click Element',
  description:
    'Click an element by its numeric ref from the latest snapshot. Returns a fresh snapshot.',
  audience: 'both',
  aiMetadata: {
    description:
      'Clicks the element identified by the numeric ref from the latest snapshot, then returns a fresh snapshot of the resulting page. Get refs from Navigate or Snapshot Page first. If the ref no longer exists, re-run Snapshot Page to get current refs. Requires a sessionId. Not idempotent.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The Session ID returned by Create Session.',
      required: true,
    }),
    ref: Property.Number({
      displayName: 'Element Ref',
      description: 'The numeric ref of the target element, from the latest snapshot.',
      required: true,
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { sessionId, ref } = context.propsValue;

    const elementId = await testmuaiCommon.findElement({
      auth,
      sessionId,
      selector: refSelector(ref),
    });

    try {
      await testmuaiCommon.sessionRequest({
        auth,
        sessionId,
        method: HttpMethod.POST,
        path: `/element/${elementId}/click`,
        body: {},
      });
    } catch (err) {
      // A transient overlay can make the native click fail. Fall back to a
      // programmatic click, which bypasses interactability checks.
      const message = err instanceof Error ? err.message : String(err);
      if (/intercept|not clickable|not interactable|stale/i.test(message)) {
        await testmuaiCommon.runScript({
          auth,
          sessionId,
          script: 'arguments[0].click();',
          args: [{ [ELEMENT_KEY]: elementId }],
        });
      } else {
        throw err;
      }
    }

    const elements = await testmuaiCommon.snapshot({ auth, sessionId });

    return {
      sessionId,
      ref,
      elements,
      snapshot: formatSnapshot(elements),
    };
  },
});
