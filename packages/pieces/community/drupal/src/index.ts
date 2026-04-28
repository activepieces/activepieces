import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { drupalCallServiceAction } from './lib/actions/services';
import { drupalCreateEntityAction } from './lib/actions/create_entity';
import { drupalListEntitiesAction } from './lib/actions/list_entities';
import { drupalGetEntityAction } from './lib/actions/get_entity';
import { drupalUpdateEntityAction } from './lib/actions/update_entity';
import { drupalDeleteEntityAction } from './lib/actions/delete_entity';
import { drupalPollingId } from './lib/triggers/polling-id';
import { drupalPollingTimestamp } from './lib/triggers/polling-timestamp';
import { drupalWebhook } from './lib/triggers/webhook';
import { drupalAuth } from './lib/auth';

export const drupal = createPiece({
  displayName: 'Drupal',
  auth: drupalAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/drupal.png',
  categories: [
    PieceCategory.BUSINESS_INTELLIGENCE,
    PieceCategory.COMMERCE,
    PieceCategory.CONTENT_AND_FILES,
    PieceCategory.FORMS_AND_SURVEYS,
    PieceCategory.MARKETING,
  ],
  authors: ['dbuytaert', 'jurgenhaas'],
  actions: [
    drupalCallServiceAction,
    drupalCreateEntityAction,
    drupalListEntitiesAction,
    drupalGetEntityAction,
    drupalUpdateEntityAction,
    drupalDeleteEntityAction
  ],
  triggers: [drupalPollingId, drupalPollingTimestamp, drupalWebhook],
});
