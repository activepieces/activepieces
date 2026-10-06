import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { deleteSpaceVariableOutputSchema } from '../output-schemas';

export const deleteSpaceVariable = createAction({
  auth: huggingFaceAuth,
  name: 'delete_space_variable',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Space Variable',
  description: 'Delete an environment variable from a Hugging Face Space.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently deletes a public environment variable from a Space; code that reads it will stop working. Deleting a variable restarts the Space. Only delete variables the user asked to remove. Do not blindly retry: the key is already gone after a success. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: deleteSpaceVariableOutputSchema,
  props: {
    space_id: Property.ShortText({
      displayName: 'Space ID',
      description: "The Space ID in 'namespace/name' form, for example 'my-user/my-demo'.",
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: "The name of the variable to delete, for example 'MODEL_NAME'.",
      required: true,
    }),
  },
  async run(context) {
    const { space_id, key } = context.propsValue;
    const token = context.auth.secret_text;
    const variableKey = hfWrite.assertSpaceKey(key);
    const space = await hfWrite.resolveRepo({ token, repoType: 'space', repoId: space_id });
    await hfWrite.request({
      token,
      method: HttpMethod.DELETE,
      path: `${space.apiPath}/variables`,
      body: { key: variableKey },
    });
    return {
      space_id: space.repoId,
      key: variableKey,
      deleted: true,
    };
  },
});
