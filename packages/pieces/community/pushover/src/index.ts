import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { sendNotification } from './lib/actions/send-notification';
import { sendPushMessage } from './lib/actions/send-push-message';
import { getReceiptStatus } from './lib/actions/get-receipt-status';
import { cancelEmergencyRetries } from './lib/actions/cancel-emergency-retries';
import { cancelEmergencyRetriesByTag } from './lib/actions/cancel-emergency-retries-by-tag';
import { validateUserKey } from './lib/actions/validate-user-key';
import { getAppLimits } from './lib/actions/get-app-limits';
import { updateGlance } from './lib/actions/update-glance';
import { listDeliveryGroups } from './lib/actions/list-delivery-groups';
import { getDeliveryGroup } from './lib/actions/get-delivery-group';
import { createDeliveryGroup } from './lib/actions/create-delivery-group';
import { renameDeliveryGroup } from './lib/actions/rename-delivery-group';
import { addUserToGroup } from './lib/actions/add-user-to-group';
import { removeUserFromGroup } from './lib/actions/remove-user-from-group';
import { disableGroupUser } from './lib/actions/disable-group-user';
import { enableGroupUser } from './lib/actions/enable-group-user';
import { getLicenseCredits } from './lib/actions/get-license-credits';
import { assignLicense } from './lib/actions/assign-license';
import { listNotificationSounds } from './lib/actions/list-notification-sounds';
import { migrateUserToSubscription } from './lib/actions/migrate-user-to-subscription';

export const pushoverAuth = PieceAuth.CustomAuth({
  description: `To connect Pushover:

1. Log in at [pushover.net](https://pushover.net).
2. Copy **Your User Key** from the top of the page.
3. Under **Your Applications**, open your app or click **Create an Application/API Token**, then copy its **API Token/Key**.

To notify a group instead, paste its group key as the User Key.`,
  props: {
    api_token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'The API Token/Key of your Pushover application.',
      required: true,
    }),
    user_key: PieceAuth.SecretText({
      displayName: 'User Key',
      description: 'Your user key, or a group key to notify a group.',
      required: true,
    }),
  },
  required: true,
});

export const pushover = createPiece({
  displayName: 'Pushover',
  description: 'Simple push notification service',

  logoUrl: 'https://cdn.activepieces.com/pieces/pushover.png',
  categories: [PieceCategory.COMMUNICATION],
  minimumSupportedRelease: '0.88.2',
  authors: ["MyWay","Vitalini","kishanprmr","khaledmashaly","abuaboud"],
  auth: pushoverAuth,
  actions: [
    sendNotification,
    sendPushMessage,
    getReceiptStatus,
    cancelEmergencyRetries,
    cancelEmergencyRetriesByTag,
    validateUserKey,
    getAppLimits,
    updateGlance,
    listDeliveryGroups,
    getDeliveryGroup,
    createDeliveryGroup,
    renameDeliveryGroup,
    addUserToGroup,
    removeUserFromGroup,
    disableGroupUser,
    enableGroupUser,
    getLicenseCredits,
    assignLicense,
    listNotificationSounds,
    migrateUserToSubscription,
  ],
  triggers: [],
});
