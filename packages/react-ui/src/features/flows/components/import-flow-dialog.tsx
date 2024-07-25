import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { flowsApi } from '../lib/flows-api';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';

const ImportFlowDialog = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createFlow } = useMutation<
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const template = JSON.parse(reader.result as string) as FlowTemplate;
        // TODO handle overwriting flow when using actions in builder
        createFlow(template);
      } catch (error) {
        toast(INTERNAL_ERROR_TOAST);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Flow</DialogTitle>
          <DialogDescription>Import a flow as a .json file</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button onClick={handleSubmit}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ImportFlowDialog };
