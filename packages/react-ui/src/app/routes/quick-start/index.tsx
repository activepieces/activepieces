import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
  MarkdownVariant,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useQuery, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CreateFlowWithAI } from './prompt-to-flow';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SelectFlowTemplateDialog } from '@/features/flows/components/select-flow-template-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { authenticationSession } from '@/lib/authentication-session';

type TemplateCardProps = {
  template: FlowTemplate;
  onSelectTemplate: (template: FlowTemplate) => void;
};

const TemplateCard = ({ template, onSelectTemplate }: TemplateCardProps) => {
  const navigate = useNavigate();

  const { mutate: createFlow, isPending } = useMutation<
    PopulatedFlow,
    Error,
    FlowTemplate
  >({
    mutationFn: async (template: FlowTemplate) => {
      const newFlow = await flowsApi.create({
        displayName: template.name,
        projectId: authenticationSession.getProjectId()!,
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

const QuickStartPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(
    null
  );
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);

  // Fetch cloud templates first
  const { isLoading: isCloudLoading } = useQuery<FlowTemplate[], Error>({
    queryKey: ['cloud-templates'],
    queryFn: async () => {
      const result = await templatesApi.listCloud();
      setTemplates((prev) => [...result.data, ...prev].slice(0, 15));
      return result.data;
    },
    staleTime: 0,
  });

  // Fetch community templates and append them when ready
  const { isLoading: isCommunityLoading } = useQuery<FlowTemplate[], Error>({
    queryKey: ['community-templates'],
    queryFn: async () => {
      const result = await templatesApi.listCommunity();
      setTemplates((prev) => [...prev, ...result.data].slice(0, 15));
      return result.data;
    },
    staleTime: 0,
  });

  const handleSelectTemplate = (template: FlowTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCloseDialog = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full grow">
      {/* Standard page header */}
      <DashboardPageHeader
        title={t('Quick Start')}
        description={t('Quickly create flows with AI or ready-made templates')}
      ></DashboardPageHeader>

      {/* Create with AI prompt input */}
      <div className="flex flex-col gap-2">
        <CreateFlowWithAI />
      </div>

      {/* Templates Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-lg">
            {t('Start quick with community templates')}
          </div>
          <SelectFlowTemplateDialog folderId={UncategorizedFolderId}>
            <Button variant="outline-primary" className="gap-2">
              {t('Browse all templates')}
            </Button>
          </SelectFlowTemplateDialog>
        </div>

        {(isCloudLoading || isCommunityLoading) && templates.length === 0 ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templates?.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelectTemplate={handleSelectTemplate}
                />
              ))}
            </div>

            {templates?.length === 0 && (
              <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('No templates found')}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Template Detail Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <>
              <div className="mb-4 p-8 flex items-center justify-center gap-2 width-full bg-green-300 rounded-lg">
                <PieceIconList
                  size="xxl"
                  trigger={selectedTemplate.template.trigger}
                  maxNumberOfIconsToShow={3}
                />
              </div>
              <ScrollArea className="min-h-[128px] max-h-[320px]">
                <ApMarkdown
                  markdown={
                    selectedTemplate?.description ?? 'No description available'
                  }
                  variant={MarkdownVariant.BORDERLESS}
                />

                {selectedTemplate.blogUrl && (
                  <div className="mt-4">
                    {t('Read more about this template in')}{' '}
                    <a
                      href={selectedTemplate.blogUrl}
                      target="_blank"
                      className="text-primary underline underline-offset-4"
                      rel="noreferrer"
                    >
                      {t('this blog!')}
                    </a>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickStartPage;
