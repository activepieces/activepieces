import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
} from '@activepieces/shared';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Info, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { flowsApi } from '../lib/flows-api';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { authenticationSession } from '@/lib/authentication-session';

const SelectFlowTemplateDialog = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>('');

  const { data: templates, isLoading } = useQuery<FlowTemplate[], Error>({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then((res) => res.data),
    staleTime: 0,
  });

  // Filter templates if the template name or the template description contains the search query
  const filteredTemplates = templates?.filter((template) => {
    const templateName = template.name.toLowerCase();
    const templateDescription = template.description.toLowerCase();
    return (
      templateName.includes(search.toLowerCase()) ||
      templateDescription.includes(search.toLowerCase())
    );
  });

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:min-w-[850px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse Templates </DialogTitle>
          <Input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search templates"
          />
        </DialogHeader>
        <DialogDescription>
          {isLoading ? (
            <div className="h-[680px] max-h-[680px] overflow-y-auto flex justify-center items-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="h-[680px] max-h-[680px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates?.map((template) => (
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
                    <div className="text-sm font-medium leading-none px-4 leading-6">
                      {template.name}
                    </div>
                    <div className="py-2 flex">
                      <Button
                        variant="link"
                        onClick={() => createFlow(template)}
                        disabled={isPending}
                      >
                        <Zap className="w-4 h-4 me-2" /> Use Template
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-full p-3 hover:bg-muted cursor-pointer flex justify-center items-center"
                        onClick={() => window.open(template.blogUrl, '_blank')} // TODO(anas): add tooltip and navigate to a screen showing the description that links to the blog
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export { SelectFlowTemplateDialog };
