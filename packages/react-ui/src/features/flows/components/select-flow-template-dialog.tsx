import { DialogDescription } from '@radix-ui/react-dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowLeft, Info, SearchX } from 'lucide-react';
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
  MarkdownVariant,
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
      <DialogContent className=" lg:min-w-[850px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex min-h-9 flex-row items-center justify-start gap-2 items-center h-full">
            {selectedTemplate && (
              <Button variant="ghost" size="sm" onClick={unselectTemplate}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {t('Browse Templates')}
          </DialogTitle>
        </DialogHeader>
        <Carousel setApi={(api) => (carousel.current = api)}>
          <CarouselContent className="min-h-[300px] h-[70vh] max-h-[680px] ">
            <CarouselItem key="templates">
              <div>
                <div className="p-1 ">
                  <Input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t('Search templates')}
                    className="mb-4"
                  />
                </div>

                <DialogDescription>
                  {isLoading ? (
                    <div className="min-h-[300px] h-[70vh] max-h-[680px]  o flex justify-center items-center">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      {filteredTemplates?.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 text-center ">
                          <SearchX className="w-10 h-10" />
                          {t('No templates found, try adjusting your search')}
                        </div>
                      )}
                      <ScrollArea className="min-h-[260px] h-[calc(70vh-80px)] max-h-[680px]   overflow-y-auto px-1">
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
                    </>
                  )}
                </DialogDescription>
              </div>
            </CarouselItem>
            <CarouselItem key="template-details">
              {selectedTemplate && (
                <div className="px-2 ">
                  <div className="mb-4 p-8 flex items-center justify-center gap-2 width-full bg-green-300 rounded-lg">
                    <PieceIconList
                      size="xxl"
                      trigger={selectedTemplate.template.trigger}
                      maxNumberOfIconsToShow={3}
                    />
                  </div>
                  <ScrollArea className="px-2 min-h-[156px] h-[calc(70vh-144px)] max-h-[536px]">
                    <div className="mb-4 text-lg font-medium font-black">
                      {selectedTemplate?.name}
                    </div>
                    <ApMarkdown
                      markdown={selectedTemplate?.description}
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
                </div>
              )}
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

export { SelectFlowTemplateDialog };
