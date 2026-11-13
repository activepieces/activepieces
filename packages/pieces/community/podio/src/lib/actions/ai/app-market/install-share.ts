import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioInstallShareOutputSchema } from '../../../output-schemas';

export const installShareAction = createAction({
  auth: podioAuth,
  name: 'podio_install_share',
  outputSchema: podioInstallShareOutputSchema,
  displayName: 'Install Share',
  description: 'Installs an app or pack from the app market into a space.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Installs a Podio app market share into a space as new apps and returns their app ids; each call installs another copy. Leave Dependencies empty to install all dependent shares. The share id comes from Get Top Shares or another share list, the space id from Get Space.',
    idempotent: false,
  },
  props: {
    shareId: podioAiProps.id({ required: true, displayName: 'Share ID', description: 'The id of the app market share, from Get Share By Reference, Get Own Shares or another share list.' }),
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space to install into, from Get Space.' }),
    dependencies: podioAiProps.idList({
      required: false,
      displayName: 'Dependencies',
      description: 'The ids of the dependent shares to install too, from Get Share. Leave empty to install all of them.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/app_store/${propsValue.shareId}/install`,
      body: podioUtils.body({ values: { space_id: Number(propsValue.spaceId), dependencies: numericIds({ ids: propsValue.dependencies }) } }),
    });
  },
});

function numericIds({ ids }: { ids: unknown[] | undefined }): number[] | undefined {
  return ids && ids.length > 0 ? ids.map((id) => Number(id)) : undefined;
}
