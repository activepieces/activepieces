import { createAction } from '@activepieces/pieces-framework';
import { gammaAuth } from '../common/auth';
import { generateGammaProps } from '../common/props';
import { GammaClient } from '../common/client';

export const generateGamma = createAction({
  auth: gammaAuth,
  name: 'generate_gamma',
  displayName: 'Generate Gamma',
  description: 'Create a new Gamma generation job.',
  props: generateGammaProps,
  async run({ auth, propsValue }) {
    const client = new GammaClient(auth);
    return await client.generate(propsValue);
  },
});
