import { createAction, Property } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { askGenieOutputSchema } from '../output-schemas';

export const askGenieAction = createAction({
  auth: databricksAuth,
  name: 'ask_genie',
  classification: 'WRITE',
  displayName: 'Ask Genie',
  description:
    'Asks a Genie space a question in plain language and returns the answer and query results.',
  audience: 'both',
  aiMetadata: {
    description:
      "Ask a Databricks AI/BI Genie space a natural-language question about its data; returns Genie's text answer, the SQL it generated and the result rows. Pass the returned conversation ID to ask a follow-up in the same conversation. Use Run SQL Query instead when you already know the SQL. Each call adds a message to the conversation.",
    idempotent: false,
  },
  props: {
    genieSpaceId: databricksProps.genieSpaceId({ required: true }),
    question: Property.LongText({
      displayName: 'Question',
      description:
        'The question to ask, e.g. "What were the top 5 products by revenue last month?"',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description:
        'Optional. The Conversation ID from an earlier Ask Genie step, to ask a follow-up question in the same conversation.',
      required: false,
    }),
  },
  outputSchema: askGenieOutputSchema,
  async run(context) {
    const { genieSpaceId, question, conversationId } = context.propsValue;
    return await databricksApi.askGenie({
      auth: context.auth,
      spaceId: genieSpaceId,
      question,
      conversationId: conversationId || undefined,
    });
  },
});
