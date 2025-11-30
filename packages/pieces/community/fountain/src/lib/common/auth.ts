import { fountainAuth } from '../../';
import { AppConnectionValueForAuthProperty, PiecePropValueSchema } from '@activepieces/pieces-framework';

export function getAuthHeaders(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>) {
  return {
    'Authorization': `Bearer ${auth.secret_text}`,
    'Content-Type': 'application/json',
  };
}
