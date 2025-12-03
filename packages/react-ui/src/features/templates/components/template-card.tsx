import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
  UncategorizedFolderId,
  isNil,
} from '@activepieces/shared';

type TemplateCardProps = {
  template: FlowTemplate;
  onSelectTemplate: (template: FlowTemplate) => void;
  folderId?: string;
};

export const TemplateCard = ({
  template,
  onSelectTemplate,
  folderId,
}: TemplateCardProps) => {
  const navigate = useNavigate();

  const { mutate: createFlow, isPending } = useMutation<
    PopulatedFlow,
    Error,
    FlowTemplate
  >({
    mutationFn: async (template: FlowTemplate) => {
      const folder =
        !isNil(folderId) && folderId !== UncategorizedFolderId
          ? await foldersApi.get(folderId)
          : undefined;
      const newFlow = await flowsApi.create({
        displayName: template.name,
        projectId: authenticationSession.getProjectId()!,
        folderName: folder?.displayName,
      });
      return await flowsApi.update(newFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: template.name,
          trigger: template.template.trigger,
          schemaVersion: template.template.schemaVersion,
        },
      });
    },
    onSuccess: (flow) => {
      navigate(`/flows/${flow.id}`);
    },
  });

  return (
    <div
      key={template.id}
      className="rounded-lg border border-solid border-dividers overflow-hidden"
    >
      <div className="flex items-center gap-2 p-4">
        <PieceIconList
          trigger={template.template.trigger}
          maxNumberOfIconsToShow={2}
        />
      </div>
      <div className="text-sm font-medium px-4 min-h-16">{template.name}</div>
      <div className="py-2 px-4 gap-1 flex items-center">
        <Button
          variant="default"
          loading={isPending}
          className="px-2 h-8"
          onClick={() => createFlow(template)}
        >
          {t('Use Template')}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="size-10 flex justify-center items-center">
              <Button
                variant="ghost"
                className="rounded-full p-3 hover:bg-muted cursor-pointer flex justify-center items-center"
                onClick={() => onSelectTemplate(template)}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span className="text-sm">{t('Learn more')}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
