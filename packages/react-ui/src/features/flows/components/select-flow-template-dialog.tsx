import { DialogDescription } from '@radix-ui/react-dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowLeft, Info, Workflow } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
} from '@activepieces/shared';

import { flowsApi } from '../lib/flows-api';

type TemplateCardProps = {
  template: FlowTemplate;
  onSelectTemplate: (template: FlowTemplate) => void;
};
const TemplateCard = ({ template, onSelectTemplate }: TemplateCardProps) => {
  const selectTemplate = (template: FlowTemplate) => {
    onSelectTemplate(template);
  };

  const navigate = useNavigate();

  const { mutate: createFlow, isPending } = useMutation<
    PopulatedFlow,
    Error,
    FlowTemplate
  >({
    mutationFn: async (template: FlowTemplate) => {
      const newFlow = await flowsApi.create({
        displayName: template.name,
        projectId: authenticationSession.getProjectId(),
      });
      return await flowsApi.update(newFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: template.name,
          trigger: template.template.trigger,
        },
      });
    },
    onSuccess: (flow) => {
      navigate(`/flows/${flow.id}`);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });
  return (
    <div
      key={template.id}
      className="rounded-lg border border-solid border-dividers overflow-hidden"
    >
      <div className="flex items-center gap-2 p-4 ">
        <PieceIconList
          trigger={template.template.trigger}
          maxNumberOfIconsToShow={2}
        />
      </div>
      <div className="text-sm font-medium px-4">{template.name}</div>
      <div className="p-2 flex">
        <Button
          variant="basic"
          loading={isPending}
          onClick={() => createFlow(template)}
        >
          <Workflow className="w-4 h-4 me-2" /> {t('Use Template')}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="size-10 flex justify-center items-center">
              <Button
                variant="ghost"
                className="rounded-full p-3 hover:bg-muted cursor-pointer flex justify-center items-center"
                onClick={() => selectTemplate(template)}
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

const SelectFlowTemplateDialog = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [search, setSearch] = useState<string>('');

  const carousel = useRef<CarouselApi>();

  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(
    null,
  );

  const { data: templates, isLoading } = useQuery<FlowTemplate[], Error>({
    queryKey: ['templates'],
    queryFn: async () => {
      const templates = await templatesApi.list();
      return templates.data;
    },
    staleTime: 0,
  });

  const filteredTemplates = templates?.filter((template) => {
    const templateName = template.name.toLowerCase();
    const templateDescription = template.description.toLowerCase();
    return (
      templateName.includes(search.toLowerCase()) ||
      templateDescription.includes(search.toLowerCase())
    );
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const unselectTemplate = () => {
    setSelectedTemplate(null);
    carousel.current?.scrollPrev();
  };

  return (
    <Dialog onOpenChange={unselectTemplate}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:min-w-[850px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center justify-start gap-2 items-center h-full">
            <Button variant="ghost" size="sm" onClick={unselectTemplate}>
              {selectedTemplate ? (
                <ArrowLeft className="w-4 h-4" />
              ) : (
                <Workflow className="w-4 h-4" />
              )}
            </Button>
            {t('Browse Templates')}
          </DialogTitle>
        </DialogHeader>
        <Carousel setApi={(api) => (carousel.current = api)}>
          <CarouselContent>
            <CarouselItem key="templates">
              <div className="p-1">
                <Input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t('Search templates')}
                  className="mb-4"
                />
                <DialogDescription>
                  {isLoading ? (
                    <div className="h-[680px] max-h-[680px] overflow-y-auto flex justify-center items-center">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <ScrollArea className="h-[680px] max-h-[680px] overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates?.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onSelectTemplate={(template) => {
                              setSelectedTemplate(template);
                              carousel.current?.scrollNext();
                            }}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </DialogDescription>
              </div>
            </CarouselItem>
            <CarouselItem key="template-details">
              {selectedTemplate ? (
                <div className="px-2">
                  <div className="mb-4 p-8 flex items-center justify-center gap-2 width-full bg-green-300 rounded-lg">
                    <PieceIconList
                      size="xl"
                      trigger={selectedTemplate.template.trigger}
                      maxNumberOfIconsToShow={3}
                    />
                  </div>
                  <div className="px-2">
                    <div className="mb-4 text-lg font-medium font-black">
                      {selectedTemplate?.name}
                    </div>
                    <ApMarkdown
                      markdown={selectedTemplate?.description}
                      withBorder={false}
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
                  </div>
                </div>
              ) : null}
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

export { SelectFlowTemplateDialog };
