import {
  ApplicationEventName,
  apId,
  BranchExecutionType,
  BranchOperator,
  FlowActionType,
  FlowTriggerType,
  PropertyExecutionType,
  RouterAction,
  RouterExecutionType,
  Template,
  TemplateStatus,
  TemplateType,
} from '@activepieces/shared';

const SCHEMA_VERSION = '20';
const WEBHOOK_PIECE_NAME = '@activepieces/piece-webhook';
const WEBHOOK_PIECE_VERSION = '0.1.33';
const WEBHOOK_TRIGGER_NAME = 'catch_webhook';
const EVENT_FIELD_PATH = "{{trigger['body']['action']}}";
const STATUS_FIELD_PATH = "{{trigger['body']['data']['flowRun']['status']}}";

export const customAlertsFlowBuilder = {
  buildCustomAlertsTemplate: ({ events, labels }: BuildParams): Template => {
    if (events.length === 0) {
      throw new Error(
        'At least one event is required to build a custom alerts flow.',
      );
    }

    const sampleData = buildSampleData(events[0].name);
    const topRouter = buildTopRouter(events, labels);
    const lastUpdatedDate = new Date().toISOString();

    return {
      id: apId(),
      created: lastUpdatedDate,
      updated: lastUpdatedDate,
      name: labels.flowDisplayName,
      type: TemplateType.CUSTOM,
      summary: labels.flowDisplayName,
      description: labels.flowDescription,
      tags: [],
      blogUrl: null,
      metadata: null,
      author: 'Activepieces',
      categories: [],
      pieces: [WEBHOOK_PIECE_NAME],
      platformId: null,
      status: TemplateStatus.PUBLISHED,
      tables: [],
      flows: [
        {
          displayName: labels.flowDisplayName,
          schemaVersion: SCHEMA_VERSION,
          valid: true,
          notes: [],
          trigger: {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            valid: true,
            displayName: labels.webhookTriggerDisplayName,
            lastUpdatedDate,
            settings: {
              pieceName: WEBHOOK_PIECE_NAME,
              pieceVersion: WEBHOOK_PIECE_VERSION,
              triggerName: WEBHOOK_TRIGGER_NAME,
              input: { authType: 'none', authFields: {} },
              sampleData,
              propertySettings: {
                authType: { type: PropertyExecutionType.MANUAL },
                authFields: {
                  type: PropertyExecutionType.MANUAL,
                  schema: {},
                },
                liveMarkdown: { type: PropertyExecutionType.MANUAL },
                syncMarkdown: { type: PropertyExecutionType.MANUAL },
                testMarkdown: { type: PropertyExecutionType.MANUAL },
              },
            },
            nextAction: topRouter,
          },
        },
      ],
    };
  },
};

function buildTopRouter(
  events: LabeledEvent[],
  labels: CustomAlertsFlowLabels,
): RouterAction {
  const lastUpdatedDate = new Date().toISOString();
  const branches: RouterBranches = events.map(({ name, label }) => ({
    branchType: BranchExecutionType.CONDITION,
    branchName: label,
    conditions: [
      [
        {
          operator: BranchOperator.TEXT_EXACTLY_MATCHES,
          firstValue: EVENT_FIELD_PATH,
          secondValue: name,
          caseSensitive: false,
        },
      ],
    ],
  }));
  branches.push({
    branchType: BranchExecutionType.FALLBACK,
    branchName: labels.otherwiseBranchName,
  });

  let nextStepIndex = 2;
  const children: (RouterAction | null)[] = events.map(({ name }) => {
    if (name !== ApplicationEventName.FLOW_RUN_FINISHED) {
      return null;
    }
    const stepName = `step_${nextStepIndex++}`;
    return buildFlowRunFinishedStatusRouter({
      stepName,
      lastUpdatedDate,
      labels,
    });
  });
  children.push(null);

  return {
    name: 'step_1',
    type: FlowActionType.ROUTER,
    valid: true,
    skip: false,
    displayName: labels.eventTypeRouterDisplayName,
    lastUpdatedDate,
    settings: {
      executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
      branches,
    },
    children,
  };
}

function buildFlowRunFinishedStatusRouter({
  stepName,
  lastUpdatedDate,
  labels,
}: {
  stepName: string;
  lastUpdatedDate: string;
  labels: CustomAlertsFlowLabels;
}): RouterAction {
  return {
    name: stepName,
    type: FlowActionType.ROUTER,
    valid: true,
    skip: false,
    displayName: labels.runStatusRouterDisplayName,
    lastUpdatedDate,
    settings: {
      executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
      branches: [
        {
          branchType: BranchExecutionType.CONDITION,
          branchName: labels.failedRunBranchName,
          conditions: [
            [
              {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: STATUS_FIELD_PATH,
                secondValue: 'FAILED',
                caseSensitive: false,
              },
            ],
          ],
        },
        {
          branchType: BranchExecutionType.FALLBACK,
          branchName: labels.otherwiseBranchName,
        },
      ],
    },
    children: [null, null],
  };
}

function buildSampleData(event: ApplicationEventName): Record<string, unknown> {
  const project = { displayName: 'Sample project' };
  const isoNow = new Date().toISOString();
  const envelope = {
    id: apId(),
    created: isoNow,
    updated: isoNow,
    ip: '127.0.0.1',
    platformId: apId(),
    projectId: apId(),
    userId: apId(),
  };

  switch (event) {
    case ApplicationEventName.FLOW_RUN_STARTED:
    case ApplicationEventName.FLOW_RUN_FINISHED:
    case ApplicationEventName.FLOW_RUN_RESUMED:
    case ApplicationEventName.FLOW_RUN_RETRIED:
      return {
        ...envelope,
        action: event,
        data: {
          flowRun: {
            id: apId(),
            startTime: isoNow,
            finishTime: isoNow,
            duration: 1234,
            environment: 'PRODUCTION',
            flowId: apId(),
            flowVersionId: apId(),
            flowDisplayName: 'Sample flow',
            status:
              event === ApplicationEventName.FLOW_RUN_FINISHED
                ? 'FAILED'
                : 'RUNNING',
          },
          project,
        },
      };
    case ApplicationEventName.FLOW_CREATED:
    case ApplicationEventName.FLOW_DELETED:
      return {
        ...envelope,
        action: event,
        data: {
          flow: { id: apId(), created: isoNow, updated: isoNow },
          project,
        },
      };
    case ApplicationEventName.FLOW_UPDATED:
      return {
        ...envelope,
        action: event,
        data: {
          flowVersion: {
            id: apId(),
            displayName: 'Sample flow',
            flowId: apId(),
            created: isoNow,
            updated: isoNow,
          },
          project,
        },
      };
    case ApplicationEventName.FOLDER_CREATED:
    case ApplicationEventName.FOLDER_UPDATED:
    case ApplicationEventName.FOLDER_DELETED:
      return {
        ...envelope,
        action: event,
        data: {
          folder: {
            id: apId(),
            displayName: 'Sample folder',
            created: isoNow,
            updated: isoNow,
          },
          project,
        },
      };
    case ApplicationEventName.CONNECTION_UPSERTED:
    case ApplicationEventName.CONNECTION_DELETED:
      return {
        ...envelope,
        action: event,
        data: {
          connection: {
            id: apId(),
            displayName: 'Sample connection',
            externalId: 'sample-connection',
          },
          project,
        },
      };
    case ApplicationEventName.USER_SIGNED_UP:
    case ApplicationEventName.USER_SIGNED_IN:
    case ApplicationEventName.USER_PASSWORD_RESET:
    case ApplicationEventName.USER_EMAIL_VERIFIED:
      return {
        ...envelope,
        action: event,
        data: {
          user: { id: apId(), email: 'sample@example.com' },
        },
      };
    case ApplicationEventName.SIGNING_KEY_CREATED:
      return {
        ...envelope,
        action: event,
        data: {
          signingKey: { id: apId(), displayName: 'Sample signing key' },
        },
      };
    case ApplicationEventName.PROJECT_ROLE_CREATED:
    case ApplicationEventName.PROJECT_ROLE_UPDATED:
    case ApplicationEventName.PROJECT_ROLE_DELETED:
      return {
        ...envelope,
        action: event,
        data: {
          projectRole: { id: apId(), name: 'Sample role' },
        },
      };
    case ApplicationEventName.PROJECT_RELEASE_CREATED:
      return {
        ...envelope,
        action: event,
        data: {
          projectRelease: { id: apId(), name: 'v1.0.0' },
          project,
        },
      };
  }
}

type RouterBranches = RouterAction['settings']['branches'];

export type LabeledEvent = {
  name: ApplicationEventName;
  label: string;
};

export type CustomAlertsFlowLabels = {
  flowDisplayName: string;
  flowDescription: string;
  webhookTriggerDisplayName: string;
  eventTypeRouterDisplayName: string;
  runStatusRouterDisplayName: string;
  failedRunBranchName: string;
  otherwiseBranchName: string;
};

type BuildParams = {
  events: LabeledEvent[];
  labels: CustomAlertsFlowLabels;
};
