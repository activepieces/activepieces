import { fountainAuth } from '../../';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';

export function getAuthHeaders(auth: PiecePropValueSchema<typeof fountainAuth>) {
  return {
    'Authorization': `Bearer ${auth}`,
    'Content-Type': 'application/json',
  };
}
