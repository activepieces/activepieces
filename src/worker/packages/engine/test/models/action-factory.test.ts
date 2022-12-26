import {createAction} from '../../src/model/action/action-factory';
import {
  CodeAction,
  CodeActionSettings,
} from '../../src/model/action/types/code-action';
import {
  LoopOnItemAction,
  LoopOnItemActionSettings,
} from '../../src/model/action/types/loop-action';
import {
  ResponseAction,
  ResponseActionSettings,
} from '../../src/model/action/types/response-action';
import { PieceAction, PieceActionSettings } from '../../src/model/action/types/piece-action';
import {ActionType} from "../../src/model/action/action-metadata";

describe('Action Factory', () => {

  test('Component action is created', async () => {
    const jsonData = {
      type: 'COMPONENT',
      name: 'COMPONENT_ACTION',
      nextAction: null,
      settings: {
        componentName: 'slack',
        actionName: 'sendMessage',
        input: {
          channel: 'channel',
          text: 'text',
        },
      },
    };

    const action = createAction(jsonData);

    expect(action).toBeInstanceOf(PieceAction);
    expect(action.type as ActionType).toEqual(ActionType.COMPONENT);
    expect(action.name).toEqual('COMPONENT_ACTION');
    expect(action.nextAction).toBeUndefined();

    expect((action as PieceAction).settings).toBeInstanceOf(PieceActionSettings);
    expect((action as PieceAction).settings.input).toEqual({
      channel: 'channel',
      text: 'text',
    });
    expect((action as PieceAction).settings.pieceName).toEqual('slack');
    expect((action as PieceAction).settings.actionName).toEqual('sendMessage');
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

    const action = createAction(jsonData);

    expect(action).toBeInstanceOf(CodeAction);
    expect(action.type as ActionType).toEqual(ActionType.CODE);
    expect(action.name).toEqual('CODE_ACTION');
    expect(action.nextAction).toBeUndefined();

    expect((action as CodeAction).settings).toBeInstanceOf(CodeActionSettings);
    expect((action as CodeAction).settings.input).toEqual({});
    expect((action as CodeAction).settings.artifactPackagedId).toEqual('artifact.zip');
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

    const action = createAction(jsonData);

    expect(action).toBeInstanceOf(LoopOnItemAction);
    expect(action.type as ActionType).toEqual(ActionType.LOOP_ON_ITEMS);
    expect(action.name).toEqual('LOOP_ACTION');
    expect(action.nextAction).toBeUndefined();

    expect((action as LoopOnItemAction).settings).toBeInstanceOf(
      LoopOnItemActionSettings
    );
    expect((action as LoopOnItemAction).settings.items).toEqual([1]);
  });

  test('RESPONSE action is created', async () => {
    const jsonData = {
      type: 'RESPONSE',
      name: 'RESPONSE_ACTION',
      nextAction: null,
      settings: {
        output: 'foo',
      },
    };

    const action = createAction(jsonData);

    expect(action).toBeInstanceOf(ResponseAction);
    expect(action.type as ActionType).toEqual(ActionType.RESPONSE);
    expect(action.name).toEqual('RESPONSE_ACTION');
    expect(action.nextAction).toBeUndefined();

    expect((action as ResponseAction).settings).toBeInstanceOf(
      ResponseActionSettings
    );
    expect((action as ResponseAction).settings.output).toEqual('foo');
  });

  test('Nested actions are created', async () => {
    const jsonData = {
      type: 'CODE',
      name: 'CODE_ACTION',
      nextAction: {
        type: 'CODE',
        name: 'CODE_ACTION',
        nextAction: {
          type: 'RESPONSE',
          name: 'RESPONSE_ACTION',
          nextAction: null,
          settings: {
            output: 'foo',
          },
        },
        settings: {
          input: {},
          artifactPackagedId: 'artifact.zip'
        },
      },
      settings: {
        input: {},
        artifactPackagedId: 'artifact.zip'
      },
    };

    const action = createAction(jsonData);

    expect(action).toBeInstanceOf(CodeAction);

    expect(action.nextAction).not.toBeUndefined();
    expect(action.nextAction).toBeInstanceOf(CodeAction);

    expect(action.nextAction!.nextAction).not.toBeUndefined();
    expect(action.nextAction!.nextAction).toBeInstanceOf(ResponseAction);
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

  test('createAction to throw on missing action attributes', async () => {
    const jsonData = {
      type: 'RESPONSE',
      nextAction: null,
      settings: {},
    };

    expect(() => {
      createAction(jsonData);
    }).toThrow();
  });
});
