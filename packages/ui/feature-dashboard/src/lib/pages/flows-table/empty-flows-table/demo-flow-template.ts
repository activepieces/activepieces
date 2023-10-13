import {
  ActionType,
  FlowVersionTemplate,
  PackageType,
  PieceType,
  TriggerType,
} from '@activepieces/shared';

export const demoTemplate: FlowVersionTemplate = {
  displayName: 'Demo: The Gelato Factory 🍦',
  trigger: {
    name: 'trigger',
    valid: true,
    displayName: 'Every 1 Minute',
    nextAction: {
      name: 'step_1',
      type: ActionType.PIECE,
      valid: true,
      settings: {
        input: {
          url: 'https://cloud.activepieces.com/api/v1/webhooks/fw0LEaZuylYKl3dOmUik5/sync',
          method: 'GET',
          headers: {},
          queryParams: {},
        },
        pieceName: '@activepieces/piece-http',
        actionName: 'send_request',
        inputUiInfo: {},
        pieceVersion: '0.2.4',
      },
      nextAction: {
        name: 'step_2',
        type: ActionType.PIECE,
        valid: true,
        settings: {
          input: {
            subject: "Hooray! {{step_1['body']['gelato']}} has been invented",
            receiver: [''],
            body_text:
              "BREAKTHROUGH!\n\nAn unprecedented type of Gelato has just been invented, the {{step_1['body']['gelato']}}.\n\nCome on and taste it, it's out of this world!",
          },
          pieceName: '@activepieces/piece-gmail',
          actionName: 'send_email',
          inputUiInfo: {},
          pieceVersion: '0.2.10',
        },
        displayName: 'Email the Gelato',
      },
      displayName: 'Invent a Gelato',
    },
    type: TriggerType.PIECE,
    settings: {
      packageType: PackageType.REGISTRY,
      pieceType: PieceType.OFFICIAL,
      pieceName: '@activepieces/piece-schedule',
      pieceVersion: '0.0.4',
      triggerName: 'cron_expression',
      input: {
        cronExpression: '0/1 * * * *',
      },
      inputUiInfo: {},
    },
  },
  valid: true,
};
