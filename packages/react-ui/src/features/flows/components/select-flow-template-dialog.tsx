import { DialogDescription } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { ArrowLeft, Search, SearchX } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { InputWithIcon } from '@/components/custom/input-with-icon';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TemplateCard } from '@/features/templates/components/template-card';
import { TemplateDetailsView } from '@/features/templates/components/template-details-view';
import { useTemplates } from '@/features/templates/hooks/templates-hook';
import { Template, TemplateType } from '@activepieces/shared';

const SelectFlowTemplateDialog = ({
  children,
  folderId,
}: {
  children: React.ReactNode;
  folderId: string;
}) => {
  const { filteredTemplates, isLoading, search, setSearch } = useTemplates({
    type: TemplateType.CUSTOM,
  });
  const carousel = useRef<CarouselApi>();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );

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
          <CarouselContent className="min-h-[300px] h-[70vh] max-h-[820px] ">
            <CarouselItem key="templates">
              <div>
                <div className="p-1 ">
                  <InputWithIcon
                    icon={<Search className="w-4 h-4" />}
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
                      <ScrollArea className="min-h-[260px] h-[calc(70vh-80px)] max-h-[740px]   overflow-y-auto px-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredTemplates?.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              folderId={folderId}
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
                <TemplateDetailsView template={selectedTemplate} />
              )}
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

export { SelectFlowTemplateDialog };
