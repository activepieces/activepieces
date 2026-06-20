import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { crawlsnapAuth } from './lib/common/auth';
import {
  vectorsnapEnrichUrl,
  vectorsnapEnrichHash,
  vectorsnapEnrichIp,
  vectorsnapEnrichDomain,
} from './lib/actions/vectorsnap';
import {
  pulsesnapScanUrl,
  pulsesnapScanHash,
  pulsesnapScanIp,
  pulsesnapScanDomain,
} from './lib/actions/pulsesnap';
import { subdosnapScan } from './lib/actions/subdosnap';

export { crawlsnapAuth };

export const crawlsnap = createPiece({
  displayName: 'CrawlSnap',
  description:
    'Structured, on-demand data intelligence APIs: VectorSnap (IoC reputation), PulseSnap (threat-intelligence pulse), and SubdoSnap (subdomain enumeration).',
  auth: crawlsnapAuth,
  // The framework clamps this up to its own context-version floor; keep it in
  // sync so the source matches the emitted metadata.
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/crawlsnap.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['crawlsnap'],
  actions: [
    vectorsnapEnrichUrl,
    vectorsnapEnrichHash,
    vectorsnapEnrichIp,
    vectorsnapEnrichDomain,
    pulsesnapScanUrl,
    pulsesnapScanHash,
    pulsesnapScanIp,
    pulsesnapScanDomain,
    subdosnapScan,
  ],
  triggers: [],
});
