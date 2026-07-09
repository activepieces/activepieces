import { createAction, Property } from '@activepieces/pieces-framework';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';

export const takeScreenshot = createAction({
  auth: testmuaiAuth,
  name: 'take_screenshot',
  displayName: 'Take Screenshot',
  description:
    'Capture a screenshot of the current page as a PNG file. Returns a file reference.',
  audience: 'both',
  aiMetadata: {
    description:
      'Captures a PNG screenshot of the current viewport and returns it as a file reference (not inline data). Use to visually inspect the page. Requires a sessionId. Idempotent and read-only.',
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

    const base64 = await testmuaiCommon.screenshot({ auth, sessionId });
    const file = await context.files.write({
      fileName: `screenshot-${sessionId}.png`,
      data: Buffer.from(base64, 'base64'),
    });

    return {
      sessionId,
      file,
    };
  },
});
