import { deleteUserAction } from './delete-user.action'
import { getExtendedUserAction } from './get-extended-user.action'
import { getOAuth2ProvidersAction } from './get-oauth2-providers.action'
import { getPrivacySettingsAction } from './get-privacy-settings.action'
import { getUserOrgAction } from './get-user-org.action'
import { getUserSessionAction } from './get-user-session.action'
import { getUserAction } from './get-user.action'
import { updatePrivacySettingsAction } from './update-privacy-settings.action'
import { updateUserAction } from './update-user.action'

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
]
