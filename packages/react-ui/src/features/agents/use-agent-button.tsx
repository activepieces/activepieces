import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ActionType,
  FlowOperationType,
  PackageType,
  PieceType,
  TriggerType,
  LATEST_SCHEMA_VERSION,
} from '@activepieces/shared';

const template = {
  created: '1751253117904',
  updated: '1751253117904',
  name: 'Chat With Agent',
  description: '',
  tags: [],
  pieces: ['@activepieces/piece-forms', '@activepieces/piece-agent'],
  template: {
    displayName: 'Chat With Agent',
    trigger: {
      name: 'trigger',
      valid: true,
      displayName: 'Chat UI',
      type: TriggerType.PIECE,
      settings: {
        pieceName: '@activepieces/piece-forms',
        pieceVersion: '~0.4.3',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        input: {
          botName: 'AI Bot',
        },
        inputUiInfo: {
          customizedInputs: {},
        },
        triggerName: 'chat_submission',
      },
      nextAction: {
        displayName: 'Fresh Agent',
        name: 'step_2',
        valid: true,
        settings: {
          pieceName: '@activepieces/piece-agent',
          pieceType: PieceType.OFFICIAL,
          packageType: PackageType.REGISTRY,
          actionName: 'run_agent',
          pieceVersion: '~0.2.0',
          input: {
            agentId: '{{AGENT_ID}}',
            prompt: "{{trigger['message']}}",
          },
          errorHandlingOptions: {
            continueOnFailure: {
              value: false,
            },
            retryOnFailure: {
              value: false,
            },
          },
          inputUiInfo: {
            customizedInputs: {},
          },
        },
        type: ActionType.PIECE,
        nextAction: {
          displayName: 'Respond on UI',
          name: 'step_1',
          valid: true,
          skip: false,
          settings: {
            pieceName: '@activepieces/piece-forms',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            actionName: 'return_response',
            pieceVersion: '~0.4.3',
            input: {
              markdown: "{{step_2['message']}}",
            },
            errorHandlingOptions: {
              continueOnFailure: {
                value: false,
              },
              retryOnFailure: {
                value: false,
              },
            },
            inputUiInfo: {
              customizedInputs: {},
            },
          },
          type: ActionType.PIECE,
        },
      },
    },
    valid: true,
    connectionIds: [],
    schemaVersion: LATEST_SCHEMA_VERSION,
  },
  blogUrl: '',
};

interface UseAgentButton {
  agentId: string;
}

export const UseAgentButton = ({ agentId }: UseAgentButton) => {
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: template.name,
      });

      const templateStr = JSON.stringify(template.template);
      const updatedTemplateStr = templateStr.replace(
        '"{{AGENT_ID}}"',
        `"${agentId}"`,
      );
      const updatedTemplate = JSON.parse(updatedTemplateStr);

      const updatedFlow = await flowsApi.update(flow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: template.template.displayName,
          trigger: updatedTemplate.trigger,
          schemaVersion: template.template.schemaVersion,
        },
      });

      return updatedFlow;
    },
    onSuccess: (data) => {
      navigate(`/flows/${data.id}`);
    },
    onError: () => {},
  });

  const hasAgentPiece = template.pieces.includes('@activepieces/piece-agent');

  if (!hasAgentPiece) {
    return null;
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <Workflow />
      {isPending ? t('Importing...') : t('Use in Flow')}
    </Button>
  );
};
