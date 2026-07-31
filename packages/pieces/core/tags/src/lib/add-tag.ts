import { Property, createAction } from '@activepieces/pieces-framework';

const markdown = `
This action add a tag to the current execution, this tag can be used to filter the execution in the **API** only at this moment.
<br>
<br>
**Note:** If you are looking to use it in the user interface, please open a feature request.
`;

export const addTag = createAction({
  audience: 'both',
  name: 'add_tag',
  displayName: 'Add Tag',
  description: 'Add a tag to the current execution',
  aiMetadata: { description: 'Attaches a label to the flow run that is currently executing, so that run can later be located or grouped by that tag when listing runs through the Activepieces API. Pick this to mark a run with a business identifier or a branch it took (e.g. a customer id, "retry", "escalated"); it affects only the current run and the tag is surfaced through the API rather than the run UI. Requires a tag name; idempotent, since the run holds a de-duplicated set of tags, so adding the same name again leaves the same end state.', idempotent: true },
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
