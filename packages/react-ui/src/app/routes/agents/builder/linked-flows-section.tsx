import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ExternalLink, Plus, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowActionType,
  FlowOperationType,
  PackageType,
  PieceType,
  LATEST_SCHEMA_VERSION,
  PopulatedFlow,
  Agent,
  FlowTriggerType,
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
      type: FlowTriggerType.PIECE,
      settings: {
        pieceName: '@activepieces/piece-forms',
        pieceVersion: '~0.4.3',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        input: {
          botName: 'AI Bot',
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
          pieceVersion: '~0.2.4',
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
        },
        type: FlowActionType.PIECE,
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
          },
          type: FlowActionType.PIECE,
        },
      },
    },
    valid: true,
    connectionIds: [],
    schemaVersion: LATEST_SCHEMA_VERSION,
  },
  blogUrl: '',
};

interface LinkedFlowsSectionProps {
  agent: Agent;
}

export const LinkedFlowsSection = ({ agent }: LinkedFlowsSectionProps) => {
  const navigate = useNavigate();

  const { data: linkedFlows, isLoading: isAgentFlowsLoading } =
    flowsHooks.useFlows({
      agentExternalIds: [agent.externalId],
      limit: 1000,
      cursor: undefined,
    });

  const { mutate: createFlow, isPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: template.name,
      });

      const templateStr = JSON.stringify(template.template);
      const updatedTemplateStr = templateStr.replace(
        '"{{AGENT_ID}}"',
        `"${agent.externalId}"`,
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
    <div>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h2 className="text-base font-medium flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          {t('Linked Flows')}
        </h2>
        <Button
          variant="basic"
          size="sm"
          className="text-secondary"
          onClick={() => createFlow()}
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isPending ? t('Importing...') : t('Use In Flow')}
        </Button>
      </div>
      <div>
        {isAgentFlowsLoading ? (
          <div className="text-sm text-muted-foreground">{t('Loading...')}</div>
        ) : linkedFlows?.data && linkedFlows.data.length > 0 ? (
          <div className="space-y-2">
            {linkedFlows.data.map((flow: PopulatedFlow) => (
              <Card
                key={flow.id}
                variant="interactive"
                onClick={() => navigate(`/flows/${flow.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {flow.version.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="link"
                        size="xs"
                        className="text-xs flex items-center gap-1 p-0 h-auto text-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `/flows/${flow.id}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t('No linked flows found')}
          </div>
        )}
      </div>
    </div>
  );
};
