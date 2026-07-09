import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';
import { refSelector, formatSnapshot } from '../common/snapshot';

// W3C WebDriver Unicode code point for the Enter key.
const ENTER_KEY = '\uE007';

export const typeText = createAction({
  auth: testmuaiAuth,
  name: 'type_text',
  displayName: 'Type Text',
  description:
    'Type text into an element by its numeric ref. Optionally press Enter. Returns a fresh snapshot.',
  audience: 'both',
  aiMetadata: {
    description:
      'Types text into the element identified by the numeric ref from the latest snapshot (clearing it first), optionally pressing Enter to submit, then returns a fresh snapshot. Get refs from Navigate or Snapshot Page. Requires a sessionId. Not idempotent.',
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
      description: 'The numeric ref of the target input element, from the latest snapshot.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to type into the element.',
      required: true,
    }),
    submit: Property.Checkbox({
      displayName: 'Submit',
      description: 'Press Enter after typing (e.g. to submit a search or form).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { sessionId, ref, text, submit } = context.propsValue;

    const elementId = await testmuaiCommon.findElement({
      auth,
      sessionId,
      selector: refSelector(ref),
    });

    // Clear first so text replaces rather than appends. Some custom /
    // contenteditable inputs reject WebDriver's clear — ignore those failures.
    try {
      await testmuaiCommon.sessionRequest({
        auth,
        sessionId,
        method: HttpMethod.POST,
        path: `/element/${elementId}/clear`,
        body: {},
      });
    } catch {
      // no-op
    }

    await testmuaiCommon.sessionRequest({
      auth,
      sessionId,
      method: HttpMethod.POST,
      path: `/element/${elementId}/value`,
      body: { text: submit ? text + ENTER_KEY : text },
    });

    const elements = await testmuaiCommon.snapshot({ auth, sessionId });

    return {
      sessionId,
      ref,
      text,
      submit: submit ?? false,
      elements,
      snapshot: formatSnapshot(elements),
    };
  },
});
