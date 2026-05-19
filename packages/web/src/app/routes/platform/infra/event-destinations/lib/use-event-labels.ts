import { ApplicationEventName } from '@activepieces/shared';
import { t } from 'i18next';

export const useEventLabels = (): EventLabelsMap => {
  return {
    [ApplicationEventName.FLOW_RUN_STARTED]: { label: t('Flow run started') },
    [ApplicationEventName.FLOW_RUN_FINISHED]: {
      label: t('Flow run finished'),
      description: t('Fires for every finished run — successful and failed.'),
    },
    [ApplicationEventName.FLOW_RUN_RESUMED]: { label: t('Flow run resumed') },
    [ApplicationEventName.FLOW_RUN_RETRIED]: { label: t('Flow run retried') },
    [ApplicationEventName.FLOW_CREATED]: { label: t('Flow created') },
    [ApplicationEventName.FLOW_UPDATED]: { label: t('Flow updated') },
    [ApplicationEventName.FLOW_DELETED]: { label: t('Flow deleted') },
    [ApplicationEventName.FOLDER_CREATED]: { label: t('Folder created') },
    [ApplicationEventName.FOLDER_UPDATED]: { label: t('Folder updated') },
    [ApplicationEventName.FOLDER_DELETED]: { label: t('Folder deleted') },
    [ApplicationEventName.CONNECTION_UPSERTED]: {
      label: t('Connection saved'),
    },
    [ApplicationEventName.CONNECTION_DELETED]: {
      label: t('Connection deleted'),
    },
    [ApplicationEventName.USER_SIGNED_UP]: { label: t('User signed up') },
    [ApplicationEventName.USER_SIGNED_IN]: { label: t('User signed in') },
    [ApplicationEventName.USER_PASSWORD_RESET]: {
      label: t('User password reset'),
    },
    [ApplicationEventName.USER_EMAIL_VERIFIED]: {
      label: t('User email verified'),
    },
    [ApplicationEventName.SIGNING_KEY_CREATED]: {
      label: t('Signing key created'),
    },
    [ApplicationEventName.PROJECT_ROLE_CREATED]: {
      label: t('Project role created'),
    },
    [ApplicationEventName.PROJECT_ROLE_UPDATED]: {
      label: t('Project role updated'),
    },
    [ApplicationEventName.PROJECT_ROLE_DELETED]: {
      label: t('Project role deleted'),
    },
    [ApplicationEventName.PROJECT_RELEASE_CREATED]: {
      label: t('Project release created'),
    },
    [ApplicationEventName.FLOW_PUBLISHED]: {
      label: t('Flow published'),
    },
    [ApplicationEventName.FLOW_ACTIVATED]: {
      label: t('Flow activated'),
    },
    [ApplicationEventName.FLOW_DEACTIVATED]: {
      label: t('Flow deactivated'),
    },
  };
};

export type EventLabel = {
  label: string;
  description?: string;
};

export type EventLabelsMap = Record<ApplicationEventName, EventLabel>;
