import { apId } from '@activepieces/core-utils';

const editorSessionId = apId();

export const editorSession = {
  getId: () => editorSessionId,
};
