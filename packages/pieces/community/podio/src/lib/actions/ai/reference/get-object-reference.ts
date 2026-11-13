import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectReferenceOutputSchema } from '../../../output-schemas';

export const getObjectReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_object_reference',
  outputSchema: podioGetObjectReferenceOutputSchema,
  displayName: 'Get Object Reference',
  description: 'Gets the title, link and creator of any Podio object by its type and id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a short summary of any Podio object by type and id: its title, link, creator, creation time and type-specific data, optionally with how many users can access it. Use it to describe an object found in a stream, notification or reference without knowing which get action fits.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the action that returns that object.' }),
    accessorCount: podioAiProps.bool({ required: false, displayName: 'Include Accessor Count', description: '"true" adds the number of users who can access the object. Defaults to "false".' }),
    contextType: podioAiProps.choice({ required: false, displayName: 'Context Type', description: 'The type of the context to check the reference against; only "app" is supported.', values: ['app'] }),
    contextId: podioAiProps.id({ required: false, displayName: 'Context ID', description: 'The id of the context, e.g. an app id from Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/reference/${propsValue.refType}/${propsValue.refId}`,
      query: podioUtils.query({
        values: {
          accessor_count: podioUtils.toBool({ value: propsValue.accessorCount }),
          context_type: propsValue.contextType,
          context_id: propsValue.contextId,
        },
      }),
    });
  },
});
