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
  description: `
    To obtain the api token:

    1. Log in to Pushover.
    2. Click on your Application or on Create an Application/API Token
    3. Copy the API Token/Key.

    To obtain the user key:
    1. Log in to Pushover
    2. Copy your Your User Key

    Note if you want to send the message to your group, you should specify a group key instead of the user key
    `,
  props: {
    api_token: PieceAuth.SecretText({
      displayName: 'Api Token',
      description: 'Pushover Api Token',
      required: true,
    }),
    user_key: PieceAuth.SecretText({
      displayName: 'User Key',
      description: 'Pushover User Key',
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
  minimumSupportedRelease: '0.87.0',
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
