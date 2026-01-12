import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatAidAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const askQuestions = createAction({
  auth: ChatAidAuth,
  name: 'askQuestions',
  displayName: 'Ask Questions',
  description:
    'Query your Chat Aid knowledge base and receive AI-generated answers with source citations',
  props: {
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'The question to ask the knowledge base',
      required: true,
    }),
    parentTs: Property.ShortText({
      displayName: 'Parent Timestamp',
      description:
        'Optional Unix timestamp for conversation threading. Use the same value for related questions in a conversation.',
      required: false,
    }),
    messageTs: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Optional Unix timestamp of current message. Use with parentTs for follow-up questions in a conversation.',
      required: false,
    }),
  },
  async run(context) {
    const { prompt, parentTs, messageTs } = context.propsValue;

    const requestBody: any = {
      prompt,
    };

    if (parentTs) {
      requestBody['parentTs'] = parentTs;
    }

    if (messageTs) {
      requestBody['messageTs'] = messageTs;
    }

    const submitResponse = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/chat/completions/custom',
      requestBody
    );

    if (!submitResponse.ok) {
      throw new Error(`Failed to submit question: ${submitResponse}`);
    }

    const { promptId, pollEndpoint, timeInterval } = submitResponse;

    const start = Date.now();
    const timeoutMs = 120 * 1000;

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    while (Date.now() - start < timeoutMs) {
      await sleep(timeInterval * 1000);

      const pollResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: pollEndpoint,
        headers: {
          Authorization: context.auth.secret_text,
        },
      });

      const pollData = pollResponse.body;

      if (!pollData.ok) {
        throw new Error(`Poll request failed: ${pollData}`);
      }

      const { canPoll } = pollData.data;

      if (!canPoll) {
        return {
          pollData,
        };
      }
    }
    
    throw new Error('Polling timeout: Answer not ready within 60 seconds');
  },
});
