import { createAction } from '@activepieces/pieces-framework';
import { gammaAuth } from '../common/auth';
import { getGenerationProps } from '../common/props';
import { GammaClient } from '../common/client';

export const getGeneration = createAction({
  auth: gammaAuth,
  name: 'get_generation',
  displayName: 'Get Generation',
  description:
    'Given a Generation ID, fetch its status, outputs, and other metadata.',
  props: getGenerationProps,
  async run({ auth, propsValue }) {
    const { generationId } = propsValue;
    const client = new GammaClient(auth);
    return await client.getGeneration(generationId);
  },
});
