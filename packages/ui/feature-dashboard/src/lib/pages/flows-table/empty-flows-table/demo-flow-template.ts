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
    displayName: 'Every One Minute',
    nextAction: {
      name: 'step_1',
      type: ActionType.PIECE,
      valid: true,
      settings: {
        input: {
          url: 'https://cloud.activepieces.com/api/v1/webhooks/fw0LEaZuylYKl3dOmUik5/sync',
          method: 'GET',
          headers: {},
          failsafe: false,
          queryParams: {},
        },
        pieceName: '@activepieces/piece-http',
        actionName: 'send_request',
        inputUiInfo: {},
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        pieceVersion: '~0.3.9',
      },
      nextAction: {
        name: 'step_2',
        type: ActionType.PIECE,
        valid: false,
        settings: {
          input: {
            cc: [],
            bcc: [],
            subject: "Hooray! ﻿{{step_1['body']['gelato']}} has been invented",
            receiver: [],
            reply_to: [],
            body_text:
              "BREAKTHROUGH!\n\nAn unprecedented type of Gelato has just been invented, the ﻿{{step_1['body']['gelato']}}\n\nCome on and taste it, it's out of this world!",
          },
          pieceName: '@activepieces/piece-gmail',
          actionName: 'send_email',
          inputUiInfo: {},
          pieceType: PieceType.OFFICIAL,
          packageType: PackageType.REGISTRY,
          pieceVersion: '~0.4.4',
        },
        displayName: 'Email the Gelato',
      },
      displayName: 'Invent a Gelato',
    },
    type: TriggerType.PIECE,
    settings: {
      pieceName: '@activepieces/piece-schedule',
      pieceVersion: '~0.1.5',
      pieceType: PieceType.OFFICIAL,
      packageType: PackageType.REGISTRY,
      triggerName: 'every_x_minutes',
      input: {
        minutes: 1,
      },
      inputUiInfo: {},
    },
  },
  valid: false,
};
