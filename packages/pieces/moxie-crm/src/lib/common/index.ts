import { PiecePropValueSchema } from '@activepieces/pieces-framework';

import { moxieCRMAuth } from '../../';
import { MoxieCRMClient } from './client';

export async function makeClient(
  auth: PiecePropValueSchema<typeof moxieCRMAuth>
): Promise<MoxieCRMClient> {
  const client = new MoxieCRMClient(auth.baseUrl, auth.apiKey);
  return client;
}
