import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { onEventChanged } from './lib/triggers/calendar-event';
import { onChangedData } from './lib/triggers/on-changed-data';
import { PieceCategory } from '@activepieces/shared';
import { eventsById } from './lib/actions/get-events-by-id';
import { weblingAuth } from './lib/auth';

export const webling = createPiece({
  displayName: 'Webling',
  auth: weblingAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/webling.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['felifluid'],
  actions: [eventsById],
  triggers: [onEventChanged, onChangedData],
});
