import { apId } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  BranchExecutionType,
  BranchOperator,
  FlowActionType,
  FlowTriggerType,
  Note,
  PieceAction,
  NoteColorVariant,
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
const HTTP_PIECE_NAME = '@activepieces/piece-http';
const HTTP_PIECE_VERSION = '0.13.0';
const HTTP_SEND_REQUEST_ACTION_NAME = 'send_request';
const OFFICIAL_PIECE_EVENTS: ReadonlySet<ApplicationEventName> = new Set([
  ApplicationEventName.OFFICIAL_PIECE_ADDED,
  ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED,
  ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED,
]);

export const handlerFlowBuilder = {
  buildHandlerFlowTemplate: ({
    events,
    labels,
    pieceSetsUrl,
  }: BuildParams): Template => {
    if (events.length === 0) {
      throw new Error(
        'At least one event is required to build a handler flow.',
      );
    }

    const topRouter = buildTopRouter({ events, labels, pieceSetsUrl });
    const hasOfficialPieceEvents = events.some(({ name }) =>
      OFFICIAL_PIECE_EVENTS.has(name),
    );
    const lastUpdatedDate = new Date().toISOString();
    const onboardingNote = buildOnboardingNote({
      content: labels.noteContent,
      timestamp: lastUpdatedDate,
    });
    const sampleDataNote = buildSampleDataNote({
      content: labels.sampleDataNoteContent,
      timestamp: lastUpdatedDate,
    });

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
      pieces: hasOfficialPieceEvents
        ? [WEBHOOK_PIECE_NAME, HTTP_PIECE_NAME]
        : [WEBHOOK_PIECE_NAME],
      platformId: null,
      status: TemplateStatus.PUBLISHED,
      tables: [],
      flows: [
        {
          displayName: labels.flowDisplayName,
          schemaVersion: SCHEMA_VERSION,
          valid: true,
          notes: [onboardingNote, sampleDataNote],
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

function buildTopRouter({
  events,
  labels,
  pieceSetsUrl,
}: BuildParams): RouterAction {
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
  const children: (RouterAction | PieceAction | null)[] = events.map(
    ({ name }) => {
      if (name === ApplicationEventName.FLOW_RUN_FINISHED) {
        return buildFlowRunFinishedStatusRouter({
          stepName: `step_${nextStepIndex++}`,
          lastUpdatedDate,
          labels,
        });
      }
      if (OFFICIAL_PIECE_EVENTS.has(name)) {
        return buildListPieceSetsStep({
          stepName: `step_${nextStepIndex++}`,
          lastUpdatedDate,
          displayName: labels.listPieceSetsStepDisplayName,
          pieceSetsUrl,
        });
      }
      return null;
    },
  );
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

function buildOnboardingNote({
  content,
  timestamp,
}: {
  content: string;
  timestamp: string;
}): Note {
  return {
    id: apId(),
    content,
    ownerId: null,
    color: NoteColorVariant.YELLOW,
    position: { x: -375, y: -105 },
    size: { width: 300, height: 298 },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildSampleDataNote({
  content,
  timestamp,
}: {
  content: string;
  timestamp: string;
}): Note {
  return {
    id: apId(),
    content,
    ownerId: null,
    color: NoteColorVariant.BLUE,
    position: {
      x: -60,
      y: -255,
    },
    size: {
      width: 234,
      height: 150,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildFlowRunFinishedStatusRouter({
  stepName,
  lastUpdatedDate,
  labels,
}: {
  stepName: string;
  lastUpdatedDate: string;
  labels: HandlerFlowLabels;
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

function buildListPieceSetsStep({
  stepName,
  lastUpdatedDate,
  displayName,
  pieceSetsUrl,
}: {
  stepName: string;
  lastUpdatedDate: string;
  displayName: string;
  pieceSetsUrl: string;
}): PieceAction {
  return {
    name: stepName,
    type: FlowActionType.PIECE,
    valid: false,
    skip: false,
    displayName,
    lastUpdatedDate,
    settings: {
      pieceName: HTTP_PIECE_NAME,
      pieceVersion: HTTP_PIECE_VERSION,
      actionName: HTTP_SEND_REQUEST_ACTION_NAME,
      input: {
        method: 'GET',
        url: pieceSetsUrl,
        headers: {},
        queryParams: { limit: '100' },
        authType: 'BEARER_TOKEN',
        authFields: { token: '' },
        body_type: 'none',
        body: {},
      },
      propertySettings: {
        method: { type: PropertyExecutionType.MANUAL },
        url: { type: PropertyExecutionType.MANUAL },
        headers: { type: PropertyExecutionType.MANUAL },
        queryParams: { type: PropertyExecutionType.MANUAL },
        authType: { type: PropertyExecutionType.MANUAL },
        authFields: { type: PropertyExecutionType.MANUAL, schema: {} },
        body_type: { type: PropertyExecutionType.MANUAL },
        body: { type: PropertyExecutionType.MANUAL, schema: {} },
      },
      errorHandlingOptions: {},
    },
  };
}

type RouterBranches = RouterAction['settings']['branches'];

export type LabeledEvent = {
  name: ApplicationEventName;
  label: string;
};

export type HandlerFlowLabels = {
  flowDisplayName: string;
  flowDescription: string;
  webhookTriggerDisplayName: string;
  eventTypeRouterDisplayName: string;
  runStatusRouterDisplayName: string;
  failedRunBranchName: string;
  listPieceSetsStepDisplayName: string;
  otherwiseBranchName: string;
  noteContent: string;
  sampleDataNoteContent: string;
};

type BuildParams = {
  events: LabeledEvent[];
  labels: HandlerFlowLabels;
  pieceSetsUrl: string;
};
