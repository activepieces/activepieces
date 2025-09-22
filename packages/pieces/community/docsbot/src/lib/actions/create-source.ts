import { createAction } from '@activepieces/pieces-framework';
import z from 'zod';
import { docsbotAuth, docsbotCommon } from '../common';
import { createSourceParams } from '../common/types';

export const createSource = createAction({
  auth: docsbotAuth,
  name: 'createSource',
  displayName: 'Create Source',
  description: 'Create a new source for a bot.',
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
        const errors = error.errors.reduce((acc, err) => {
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
