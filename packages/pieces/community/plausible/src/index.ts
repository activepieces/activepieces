import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getRealtimeVisitors } from './lib/actions/get-realtime-visitors.action';
import { getAggregateStats } from './lib/actions/get-aggregate-stats.action';
import { getBreakdown } from './lib/actions/get-breakdown.action';
import { trafficSpike } from './lib/triggers/traffic-spike.trigger';

export const plausibleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Plausible API key from plausible.io/settings/api-keys',
  required: true,
});

export const plausible = createPiece({
  displayName: 'Plausible Analytics',
  description: 'Privacy-friendly website analytics',
  auth: plausibleAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/plausible.png',
  categories: [PieceCategory.ANALYTICS],
  authors: ['Tosh94'],
  actions: [getRealtimeVisitors, getAggregateStats, getBreakdown],
  triggers: [trafficSpike],
});
