import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { ip2geoAuth } from './lib/common/auth';
import { ipLookup } from './lib/actions/ip-lookup';

export const ip2geo = createPiece({
  displayName: 'ip2geo',
  description:
    'Convert IP addresses into geolocation data including city, country, timezone, ASN, and currency.',
  auth: ip2geoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ip2geo.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bfzli'],
  actions: [ipLookup],
  triggers: [],
});
