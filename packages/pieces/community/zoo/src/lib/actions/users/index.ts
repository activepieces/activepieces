import { getUserAction } from './get-user.action';
import { updateUserAction } from './update-user.action';
import { deleteUserAction } from './delete-user.action';
import { getExtendedUserAction } from './get-extended-user.action';
import { getOAuth2ProvidersAction } from './get-oauth2-providers.action';
import { getUserOrgAction } from './get-user-org.action';
import { getPrivacySettingsAction } from './get-privacy-settings.action';
import { updatePrivacySettingsAction } from './update-privacy-settings.action';
import { getUserSessionAction } from './get-user-session.action';

export const USER_ACTIONS = [
  getUserAction,
  updateUserAction,
  deleteUserAction,
  getExtendedUserAction,
  getOAuth2ProvidersAction,
  getUserOrgAction,
  getPrivacySettingsAction,
  updatePrivacySettingsAction,
  getUserSessionAction,
];
