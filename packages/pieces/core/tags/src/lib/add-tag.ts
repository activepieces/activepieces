import { Property, createAction } from '@activepieces/pieces-framework';

const markdown = `
This action add a tag to the current execution, this tag can be used to filter the execution in the **API** only at this moment.
<br>
<br>
**Note:** If you are looking to use it in the user interface, please open a feature request.
`;

export const addTag = createAction({
  name: 'add_tag',
  displayName: 'Add Tag',
  description: 'Add a tag to the current execution',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    info: Property.MarkDown({
      value: markdown,
    }),
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: undefined,
      required: true,
    }),
  },
  async run(ctx) {
    await ctx.tags.add({
      name: ctx.propsValue.name,
    });
    return {
      success: true,
    };
  },
});
