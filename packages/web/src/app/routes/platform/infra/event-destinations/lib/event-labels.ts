import { ApplicationEventName } from '@activepieces/shared';
import { t } from 'i18next';

export const buildEventLabels = (): EventLabelsMap => {
  return {
    [ApplicationEventName.AGENT_CREATED]: t('Agent created'),
    [ApplicationEventName.AGENT_UPDATED]: t('Agent updated'),
    [ApplicationEventName.AGENT_DELETED]: t('Agent deleted'),
    [ApplicationEventName.AGENT_PUBLISHED]: t('Agent published'),
    [ApplicationEventName.AGENT_UNPUBLISHED]: t('Agent taken offline'),
    [ApplicationEventName.AGENT_ACTION_EXECUTED]: t('Agent ran an action'),
    [ApplicationEventName.FLOW_RUN_STARTED]: t('Flow run started'),
    [ApplicationEventName.FLOW_RUN_FINISHED]: t('Flow run finished'),
    [ApplicationEventName.FLOW_RUN_RESUMED]: t('Flow run resumed'),
    [ApplicationEventName.FLOW_RUN_RETRIED]: t('Flow run retried'),
    [ApplicationEventName.FLOW_CREATED]: t('Flow created'),
    [ApplicationEventName.FLOW_UPDATED]: t('Flow updated'),
    [ApplicationEventName.FLOW_DELETED]: t('Flow deleted'),
    [ApplicationEventName.FLOW_PIECES_UPGRADED]: t('Flow pieces upgraded'),
    [ApplicationEventName.FLOW_PIECES_REVERTED]: t('Flow pieces reverted'),
    [ApplicationEventName.FOLDER_CREATED]: t('Folder created'),
    [ApplicationEventName.FOLDER_UPDATED]: t('Folder updated'),
    [ApplicationEventName.FOLDER_DELETED]: t('Folder deleted'),
    [ApplicationEventName.CONNECTION_UPSERTED]: t('Connection saved'),
    [ApplicationEventName.CONNECTION_DELETED]: t('Connection deleted'),
    [ApplicationEventName.VARIABLE_UPSERTED]: t('Variable saved'),
    [ApplicationEventName.VARIABLE_DELETED]: t('Variable deleted'),
    [ApplicationEventName.VARIABLE_VALUE_REVEALED]: t(
      'Variable value revealed',
    ),
    [ApplicationEventName.USER_SIGNED_UP]: t('User signed up'),
    [ApplicationEventName.USER_SIGNED_IN]: t('User signed in'),
    [ApplicationEventName.USER_PASSWORD_RESET]: t('User password reset'),
    [ApplicationEventName.USER_EMAIL_VERIFIED]: t('User email verified'),
    [ApplicationEventName.SIGNING_KEY_CREATED]: t('Signing key created'),
    [ApplicationEventName.PROJECT_ROLE_CREATED]: t('Project role created'),
    [ApplicationEventName.PROJECT_ROLE_UPDATED]: t('Project role updated'),
    [ApplicationEventName.PROJECT_ROLE_DELETED]: t('Project role deleted'),
    [ApplicationEventName.PROJECT_RELEASE_CREATED]: t(
      'Project release created',
    ),
    [ApplicationEventName.PROJECT_REPLACED]: t('Project replaced'),
    [ApplicationEventName.FLOW_PUBLISHED]: t('Flow published'),
    [ApplicationEventName.FLOW_ACTIVATED]: t('Flow activated'),
    [ApplicationEventName.FLOW_DEACTIVATED]: t('Flow deactivated'),
    [ApplicationEventName.FLOW_APPROVAL_REQUESTED]: t(
      'Flow approval requested',
    ),
    [ApplicationEventName.FLOW_APPROVAL_GRANTED]: t('Flow approval granted'),
    [ApplicationEventName.FLOW_APPROVAL_REJECTED]: t('Flow approval rejected'),
    [ApplicationEventName.FLOW_APPROVAL_WITHDRAWN]: t(
      'Flow approval withdrawn',
    ),
  };
};

export type EventLabelsMap = Record<ApplicationEventName, string>;
