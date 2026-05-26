import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const createFileAction = createAction({
  auth: markyAuth,
  name: 'create-file',
  displayName: 'Create File',
  description:
    "Create a markdown file in a business's library. Files can be used as context for post generation.",
  props: {
    businessId: markyProps.business(),
    path: Property.ShortText({
      displayName: 'Path',
      description: "File path (e.g. '/documents/my-notes').",
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Markdown content of the file.',
      required: true,
    }),
  },
  async run(context) {
    const businessId = markyUtils.getRequiredString({
      value: context.propsValue.businessId,
      fieldName: 'Business',
    });
    const path = markyUtils.getRequiredString({
      value: context.propsValue.path,
      fieldName: 'Path',
    });
    const content = markyUtils.getRequiredString({
      value: context.propsValue.content,
      fieldName: 'Content',
    });

    const result = await markyClient.createFile({
      apiKey: context.auth.secret_text,
      body: { business_id: businessId, path, content },
    });

    if (!result.ok) {
      throw new Error(`Failed to create file: ${result.message}`);
    }

    return result.data;
  },
});

export { createFileAction };
