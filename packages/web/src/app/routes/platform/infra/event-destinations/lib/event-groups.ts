import { ApplicationEventName } from '@activepieces/shared';
import { t } from 'i18next';

export const buildEventGroups = (): EventGroup[] => {
  return [
    {
      key: 'flows',
      title: t('Flows'),
      events: [
        ApplicationEventName.FLOW_CREATED,
        ApplicationEventName.FLOW_UPDATED,
        ApplicationEventName.FLOW_DELETED,
        ApplicationEventName.FLOW_PUBLISHED,
        ApplicationEventName.FLOW_ACTIVATED,
        ApplicationEventName.FLOW_DEACTIVATED,
        ApplicationEventName.FLOW_PIECES_UPGRADED,
        ApplicationEventName.FLOW_PIECES_REVERTED,
      ],
    },
    {
      key: 'runs',
      title: t('Runs'),
      events: [
        ApplicationEventName.FLOW_RUN_STARTED,
        ApplicationEventName.FLOW_RUN_FINISHED,
        ApplicationEventName.FLOW_RUN_RESUMED,
        ApplicationEventName.FLOW_RUN_RETRIED,
      ],
    },
    {
      key: 'approvals',
      title: t('Approvals'),
      events: [
        ApplicationEventName.FLOW_APPROVAL_REQUESTED,
        ApplicationEventName.FLOW_APPROVAL_GRANTED,
        ApplicationEventName.FLOW_APPROVAL_REJECTED,
        ApplicationEventName.FLOW_APPROVAL_WITHDRAWN,
      ],
    },
    {
      key: 'agents',
      title: t('Agents'),
      events: [
        ApplicationEventName.AGENT_CREATED,
        ApplicationEventName.AGENT_UPDATED,
        ApplicationEventName.AGENT_DELETED,
        ApplicationEventName.AGENT_PUBLISHED,
        ApplicationEventName.AGENT_UNPUBLISHED,
        ApplicationEventName.AGENT_ACTION_EXECUTED,
      ],
    },
    {
      key: 'folders',
      title: t('Folders'),
      events: [
        ApplicationEventName.FOLDER_CREATED,
        ApplicationEventName.FOLDER_UPDATED,
        ApplicationEventName.FOLDER_DELETED,
      ],
    },
    {
      key: 'connections',
      title: t('Connections'),
      events: [
        ApplicationEventName.CONNECTION_UPSERTED,
        ApplicationEventName.CONNECTION_DELETED,
      ],
    },
    {
      key: 'variables',
      title: t('Variables'),
      events: [
        ApplicationEventName.VARIABLE_UPSERTED,
        ApplicationEventName.VARIABLE_DELETED,
        ApplicationEventName.VARIABLE_VALUE_REVEALED,
      ],
    },
    {
      key: 'users',
      title: t('Users & access'),
      events: [
        ApplicationEventName.USER_SIGNED_UP,
        ApplicationEventName.USER_SIGNED_IN,
        ApplicationEventName.USER_PASSWORD_RESET,
        ApplicationEventName.USER_EMAIL_VERIFIED,
        ApplicationEventName.SIGNING_KEY_CREATED,
      ],
    },
    {
      key: 'projects',
      title: t('Projects'),
      events: [
        ApplicationEventName.PROJECT_ROLE_CREATED,
        ApplicationEventName.PROJECT_ROLE_UPDATED,
        ApplicationEventName.PROJECT_ROLE_DELETED,
        ApplicationEventName.PROJECT_RELEASE_CREATED,
        ApplicationEventName.PROJECT_REPLACED,
      ],
    },
  ];
};

export type EventGroup = {
  key: string;
  title: string;
  events: ApplicationEventName[];
};
