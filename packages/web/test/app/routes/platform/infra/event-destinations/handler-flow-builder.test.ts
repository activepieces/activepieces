import {
  ApplicationEventName,
  FlowActionType,
  PieceAction,
  RouterAction,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { handlerFlowBuilder } from '@/app/routes/platform/infra/event-destinations/lib/handler-flow-builder';

const PIECE_SETS_URL = 'https://cloud.example.com/api/v1/piece-sets';

const labels = {
  flowDisplayName: 'flow',
  flowDescription: 'description',
  webhookTriggerDisplayName: 'trigger',
  eventTypeRouterDisplayName: 'router',
  runStatusRouterDisplayName: 'status',
  failedRunBranchName: 'failed',
  listPieceSetsStepDisplayName: 'List piece sets',
  otherwiseBranchName: 'otherwise',
  noteContent: 'note',
  sampleDataNoteContent: 'sample',
};

function buildRouter(events: ApplicationEventName[]): RouterAction {
  const template = handlerFlowBuilder.buildHandlerFlowTemplate({
    events: events.map((name) => ({ name, label: name })),
    labels,
    pieceSetsUrl: PIECE_SETS_URL,
  });
  const router = template.flows?.[0]?.trigger.nextAction;
  if (router?.type !== FlowActionType.ROUTER) {
    throw new Error('expected a router after the trigger');
  }
  return router;
}

describe('handlerFlowBuilder.buildHandlerFlowTemplate', () => {
  it('puts a piece sets request in each official piece branch', () => {
    const router = buildRouter([
      ApplicationEventName.OFFICIAL_PIECE_ADDED,
      ApplicationEventName.FLOW_RUN_FINISHED,
      ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED,
      ApplicationEventName.FLOW_CREATED,
    ]);

    const [pieceAdded, runFinished, patchAdded, flowCreated, otherwise] =
      router.children;
    const pieceSteps = [pieceAdded, patchAdded].filter(
      (step): step is PieceAction => step?.type === FlowActionType.PIECE,
    );
    expect(pieceSteps.map((step) => step.name)).toEqual(['step_2', 'step_4']);
    expect(pieceSteps[0].settings).toMatchObject({
      pieceName: '@activepieces/piece-http',
      actionName: 'send_request',
      input: {
        method: 'GET',
        url: PIECE_SETS_URL,
        authType: 'BEARER_TOKEN',
      },
    });
    expect(runFinished?.type).toBe(FlowActionType.ROUTER);
    expect(flowCreated).toBeNull();
    expect(otherwise).toBeNull();
  });

  it('lists the HTTP piece only when an official piece event is selected', () => {
    const withPieces = handlerFlowBuilder.buildHandlerFlowTemplate({
      events: [
        {
          name: ApplicationEventName.OFFICIAL_PIECE_ADDED,
          label: 'added',
        },
      ],
      labels,
      pieceSetsUrl: PIECE_SETS_URL,
    });
    const withoutPieces = handlerFlowBuilder.buildHandlerFlowTemplate({
      events: [{ name: ApplicationEventName.FLOW_CREATED, label: 'created' }],
      labels,
      pieceSetsUrl: PIECE_SETS_URL,
    });

    expect(withPieces.pieces).toEqual([
      '@activepieces/piece-webhook',
      '@activepieces/piece-http',
    ]);
    expect(withoutPieces.pieces).toEqual(['@activepieces/piece-webhook']);
  });
});
