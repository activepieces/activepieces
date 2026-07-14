import { createAction, Property } from '@activepieces/pieces-framework';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';

export const executeScript = createAction({
  auth: testmuaiAuth,
  name: 'execute_script',
  displayName: 'Execute Script',
  description:
    'Run JavaScript inside the current page and return its result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a JavaScript snippet inside the current page and returns its result. The script MUST use `return` to produce output (e.g. `return document.title;`). Access provided Arguments as arguments[0], arguments[1], etc. — note all arguments arrive as strings, so parse them inside the script if you need numbers or booleans. Use only when the dedicated actions are not enough. Requires a sessionId.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The Session ID returned by Create Session.',
      required: true,
    }),
    script: Property.LongText({
      displayName: 'Script',
      description:
        'JavaScript to execute in the page. Use `return` to return a value; access Arguments as arguments[0], arguments[1], ...',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description:
        'Optional values passed to the script as arguments[0], arguments[1], ... All arguments are passed as strings; parse them inside the script if you need numbers or booleans.',
      required: false,
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { sessionId, script, args } = context.propsValue;

    const result = await testmuaiCommon.runScript({
      auth,
      sessionId,
      script,
      args: args ?? [],
    });

    return {
      sessionId,
      result,
    };
  },
});
