import {createAction} from '../../src/action/action-factory';
import {PieceActionHandler} from "../../src/action/piece-action-handler";
import {ActionType, PieceAction} from "@activepieces/shared";
import {CodeActionHandler} from "../../src/action/code-action-handler";
import exp = require("constants");
import {ActionHandler} from "../../src/action/action-handler";

describe('Action Factory', () => {

  test('Component action is created', async () => {
    const jsonData: PieceAction = {
      type: ActionType.PIECE,
      name: 'COMPONENT_ACTION',
      displayName: 'COMPONENT_ACTION',
      valid: false,
      nextAction: undefined,
      settings: {
        pieceName: 'slack',
        actionName: 'sendMessage',
        input: {
          channel: 'channel',
          text: 'text',
        },
      },
    };

    const actionHandler = createAction(jsonData);

    expect(actionHandler).toBeDefined();
    expect(actionHandler).toBeInstanceOf(PieceActionHandler);
    expect(actionHandler!.action.type as ActionType).toEqual(ActionType.PIECE);
    expect(actionHandler!.action.name).toEqual('COMPONENT_ACTION');
    expect(actionHandler!.nextAction).toBeUndefined();

    expect(actionHandler!.action.settings.input).toEqual({
      channel: 'channel',
      text: 'text',
    });
    expect(actionHandler!.action.settings.pieceName).toEqual('slack');
    expect(actionHandler!.action.settings.actionName).toEqual('sendMessage');
  });

  test('CODE action is created', async () => {
    const jsonData = {
      type: 'CODE',
      name: 'CODE_ACTION',
      nextAction: null,
      settings: {
        input: {},
        artifactPackagedId: 'artifact.zip'
      },
    };

    const handler: ActionHandler = createAction(jsonData)!;

    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(CodeActionHandler);
    expect(handler.action.type as ActionType).toEqual(ActionType.CODE);
    expect(handler.action.name).toEqual('CODE_ACTION');
    expect(handler.nextAction).toBeUndefined();

    expect(handler.action.settings.input).toEqual({});
    expect(handler.action.settings.artifactPackagedId).toEqual('artifact.zip');
  });

  test('LOOP_ON_ITEMS action is created', async () => {
    const jsonData = {
      type: 'LOOP_ON_ITEMS',
      name: 'LOOP_ACTION',
      nextAction: null,
      firstLoopAction: null,
      settings: {
        items: [1],
      },
    };

    const handler: ActionHandler = createAction(jsonData)!;
    expect(handler).toBeDefined();
    expect(handler.action.type as ActionType).toEqual(ActionType.LOOP_ON_ITEMS);
    expect(handler.action.name).toEqual('LOOP_ACTION');
    expect(handler.nextAction).toBeUndefined();

    expect(handler.action.settings.items).toEqual([1]);
  });


  test('createAction to throw on invalid action type', async () => {
    const jsonData = {
      type: 'INVALID',
      name: 'INVALID_ACTION',
      nextAction: null,
      settings: {},
    };

    expect(() => {
      createAction(jsonData);
    }).toThrow();
  });


});
