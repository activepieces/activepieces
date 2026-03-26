import { PieceAuth } from '@activepieces/pieces-framework';

// No auth needed — GetOpplify is a native piece.
// The AP project's externalId maps to a Supabase user, which maps to a company.
// All API calls use this identity chain instead of a separate API key.
export const opplifyAuth = PieceAuth.None();
