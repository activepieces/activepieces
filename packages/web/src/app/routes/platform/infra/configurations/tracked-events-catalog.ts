import { TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { Layers, LucideIcon, Mail, User, Workflow } from 'lucide-react';

const buildEventLabels = (): Record<TelemetryEventName, TrackedEvent> => ({
  [TelemetryEventName.SIGNED_UP]: {
    group: 'accounts',
    label: t('Account created'),
  },
  [TelemetryEventName.SIGNED_IN]: {
    group: 'accounts',
    label: t('Signed in'),
  },
  [TelemetryEventName.SIGN_UP_SUBMITTED]: {
    group: 'accounts',
    label: t('Sign-up form submitted'),
  },
  [TelemetryEventName.SIGN_UP_FAILED]: {
    group: 'accounts',
    label: t('Sign-up failed'),
  },
  [TelemetryEventName.SIGN_IN_SUBMITTED]: {
    group: 'accounts',
    label: t('Sign-in form submitted'),
  },
  [TelemetryEventName.SIGN_IN_FAILED]: {
    group: 'accounts',
    label: t('Sign-in failed'),
  },
  [TelemetryEventName.FEDERATED_LOGIN_STARTED]: {
    group: 'accounts',
    label: t('Signed in with a federated provider'),
  },
  [TelemetryEventName.EMAIL_VERIFICATION_COMPLETED]: {
    group: 'accounts',
    label: t('Email address verified'),
  },
  [TelemetryEventName.CAPTCHA_UNAVAILABLE]: {
    group: 'accounts',
    label: t('Captcha failed to load'),
  },
  [TelemetryEventName.EMAIL_CODE_REQUESTED]: {
    group: 'emailCodes',
    label: t('Code requested'),
  },
  [TelemetryEventName.EMAIL_CODE_VERIFIED]: {
    group: 'emailCodes',
    label: t('Code verified'),
  },
  [TelemetryEventName.EMAIL_CODE_REJECTED]: {
    group: 'emailCodes',
    label: t('Code rejected'),
  },
  [TelemetryEventName.EMAIL_CODE_RESEND_REQUESTED]: {
    group: 'emailCodes',
    label: t('Code resent'),
  },
  [TelemetryEventName.CREATED_FLOW]: {
    group: 'flows',
    label: t('Flow created'),
  },
  [TelemetryEventName.FLOW_RUN_CREATED]: {
    group: 'flows',
    label: t('Flow run'),
  },
  [TelemetryEventName.FLOW_PUBLISHED]: {
    group: 'flows',
    label: t('Flow published'),
  },
  [TelemetryEventName.FLOW_IMPORTED_USING_FILE]: {
    group: 'flows',
    label: t('Flow imported'),
  },
  [TelemetryEventName.PIECE_SELECTOR_SEARCH]: {
    group: 'flows',
    label: t('Searched the step picker'),
  },
  [TelemetryEventName.MCP_SERVER_CONNECTED]: {
    group: 'mcp',
    label: t('MCP server connected'),
  },
  [TelemetryEventName.MCP_TOOL_CALLED]: {
    group: 'mcp',
    label: t('MCP tool called'),
  },
});

const buildGroups = (): TrackedEventGroup[] => {
  const events = buildEventLabels();
  const definitions: TrackedEventGroupDefinition[] = [
    { id: 'accounts', title: t('Accounts and sign-in'), icon: User },
    { id: 'emailCodes', title: t('Emailed sign-in codes'), icon: Mail },
    { id: 'flows', title: t('Flows and the builder'), icon: Workflow },
    { id: 'mcp', title: t('MCP'), icon: Layers },
  ];
  return definitions.map((definition) => ({
    ...definition,
    labels: Object.values(events)
      .filter((event) => event.group === definition.id)
      .map((event) => event.label),
  }));
};

export const trackedEventsCatalog = { buildEventLabels, buildGroups };

export type TrackedEventGroupId = 'accounts' | 'emailCodes' | 'flows' | 'mcp';

export type TrackedEvent = {
  group: TrackedEventGroupId;
  label: string;
};

export type TrackedEventGroupDefinition = {
  id: TrackedEventGroupId;
  title: string;
  icon: LucideIcon;
};

export type TrackedEventGroup = TrackedEventGroupDefinition & {
  labels: string[];
};
