import { createAction, Property } from '@activepieces/pieces-framework';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';
import { refSelector } from '../common/snapshot';

export const getText = createAction({
  auth: testmuaiAuth,
  name: 'get_text',
  displayName: 'Get Text',
  description:
    'Read visible text from a single element (by ref) or the whole page body.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads visible text from the page. Provide a ref (from the latest snapshot) to read one element, or leave it empty to read the entire page body. Use to extract readable content. Requires a sessionId. Idempotent and read-only.',
    idempotent: true,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The Session ID returned by Create Session.',
      required: true,
    }),
    ref: Property.Number({
      displayName: 'Element Ref',
      description:
        'The numeric ref of a specific element (from the latest snapshot). Leave empty to read the whole page body.',
      required: false,
    }),
    maxLength: Property.Number({
      displayName: 'Max Length',
      description: 'Maximum number of characters of text to return.',
      required: false,
      defaultValue: 4000,
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { sessionId, ref } = context.propsValue;
    const maxLength = context.propsValue.maxLength ?? 4000;

    let text = '';
    if (ref !== undefined && ref !== null) {
      const elementId = await testmuaiCommon.findElement({
        auth,
        sessionId,
        selector: refSelector(ref),
      });
      text = await testmuaiCommon.elementText({ auth, sessionId, elementId });
    } else {
      text =
        (await testmuaiCommon.runScript<string>({
          auth,
          sessionId,
          script: 'return document.body.innerText || "";',
        })) ?? '';
    }

    const trimmed = text.replace(/\s+/g, ' ').trim();

    return {
      sessionId,
      text: trimmed.slice(0, maxLength),
      length: trimmed.length,
      truncated: trimmed.length > maxLength,
    };
  },
});
