import { createAction, Property } from '@activepieces/pieces-framework';
import { rapidTextAiAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { modelDropdown } from '../common/props';

export const generateArticleAction = createAction({
  name: 'generate-article',
  auth: rapidTextAiAuth,
  displayName: 'Generate Article',
  description: 'Generates an article.',
  audience: 'both',
  aiMetadata: { description: 'Generates a long-form article from a text prompt using a selected RapidTextAI model. Choose this for full article/blog drafting rather than short freeform chat completions (use Send Prompt for that). Requires a prompt and a model selection; each call produces fresh non-deterministic output, so it is not idempotent.', idempotent: false },
  props: {
    model: modelDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
  },
  async run(context) {
    const { model, prompt } = context.propsValue;
    const response = await httpClient.sendRequest<{
      choices: { message: { content: string } }[];
    }>({
      method: HttpMethod.POST,
      url: 'https://app.rapidtextai.com/openai/v1/chat/completionsarticle',
      queryParams: {
        gigsixkey: context.auth.secret_text,
      },
      body: {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
    });

    return response.body.choices[0].message.content;
  },
});
