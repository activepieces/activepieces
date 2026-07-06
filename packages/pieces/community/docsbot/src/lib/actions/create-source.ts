import { createAction } from '@activepieces/pieces-framework';
import z from 'zod';
import { docsbotAuth, docsbotCommon } from '../common';
import { createSourceParams } from '../common/types';

export const createSource = createAction({
  auth: docsbotAuth,
  name: 'createSource',
  displayName: 'Create Source',
  description: 'Create a new source for a bot.',
  audience: 'both',
  aiMetadata: { description: 'Add a new training source to a DocsBot bot so it can answer from that content. The source type selects the mode: url/sitemap/youtube/rss ingest from a URL, document/wp/csv/urls ingest from a previously uploaded file path (use Upload Source File first), and qa ingests an array of question/answer pairs. Creates a new source on each call, so it is not idempotent.', idempotent: false },
  props: docsbotCommon.createSourceProperties(),
  async run({ auth: apiKey, propsValue }) {
    // Some fields are conditionally required, so we need to use Zod validation manually here
    const { sourceProperties, ...props } = propsValue;
    const parsedProps: createSourceParams = {
      ...props,
      ...sourceProperties,
    };
    try {
      await docsbotCommon.createSourceSchema.parseAsync(parsedProps);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.reduce((acc: Record<string, string>, err: z.ZodIssue) => {
          const path = err.path.join('.');
          return {
            ...acc,
            [path]: err.message,
          };
        }, {});
        throw new Error(JSON.stringify({ errors }, null, 2));
      }
      throw error;
    }

    const { faqs, ...restProps } = parsedProps;

    return await docsbotCommon.createSource({
      apiKey,
      ...restProps,
      faqs: faqs as { question: string; answer: string }[] | undefined,
    });
  },
});
