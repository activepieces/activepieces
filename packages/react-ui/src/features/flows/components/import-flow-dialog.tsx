import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode, isAxiosError } from 'axios';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTelemetry } from '@/components/telemetry-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowOperationType,
  FlowTemplate,
  PopulatedFlow,
  TelemetryEventName,
} from '@activepieces/shared';

import { FormError } from '../../../components/ui/form';
import { flowsApi } from '../lib/flows-api';

export type ImportFlowDialogProps =
  | {
      insideBuilder: false;
    }
  | {
      insideBuilder: true;
      flowId: string;
    };

const readTemplateJson = (
  templateFile: File,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  setTemplate: React.Dispatch<React.SetStateAction<FlowTemplate | null>>,
) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const template = JSON.parse(reader.result as string);
      if (!template.template || !template.name || !template.template.trigger) {
        setErrorMessage(t('Invalid JSON file'));
      } else {
        setErrorMessage('');
        setTemplate(template as FlowTemplate);
      }
    } catch (error) {
      setErrorMessage(t('Invalid JSON file'));
      console.log(error);
    }
  };
  reader.readAsText(templateFile);
};
const ImportFlowDialog = (
  props: ImportFlowDialogProps & { children: React.ReactNode },
) => {
  const navigate = useNavigate();
  const { capture } = useTelemetry();
  const [template, setTemplate] = useState<FlowTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { mutate: importFlow, isPending } = useMutation<
    PopulatedFlow,
    Error,
    FlowTemplate
  >({
    mutationFn: async (template: FlowTemplate) => {
      const flow = props.insideBuilder
        ? await flowsApi.get(props.flowId)
        : await flowsApi.create({
            displayName: template.name,
            projectId: authenticationSession.getProjectId()!,
          });

      return await flowsApi.update(flow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: template.name,
          trigger: template.template.trigger,
        },
      });
    },
    onSuccess: (flow) => {
      capture({
        name: TelemetryEventName.FLOW_IMPORTED_USING_FILE,
        payload: {
          location: props.insideBuilder
            ? 'inside the builder'
            : 'inside dashboard',
        },
      });
      if (!props.insideBuilder) {
        navigate(`/flows/${flow.id}`);
      } else {
        window.location.reload();
      }
    },
    onError: (err) => {
      if (
        isAxiosError(err) &&
        err.response?.status === HttpStatusCode.BadRequest
      ) {
        setErrorMessage(t('Template file is invalid'));
        console.log(err);
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      readTemplateJson(event.target.files?.[0], setErrorMessage, setTemplate);
    }
  };

  const handleSubmit = async () => {
    if (!template) {
      setErrorMessage(t('Please select a file first'));
    } else {
      setErrorMessage('');
      importFlow(template);
    }
  };

  return (
    <Dialog
      onOpenChange={() => {
        setErrorMessage('');
        setTemplate(null);
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex flex-col gap-3">
            <DialogTitle>{t('Import Flow')}</DialogTitle>
            {props.insideBuilder && (
              <div className="flex gap-1 items-center text-muted-foreground">
                <TriangleAlert className="w-5 h-5 stroke-warning"></TriangleAlert>
                <div className="font-semibold">{t('Warning')}:</div>
                <div>
                  {t('Importing a flow will overwrite your current one.')}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="flex gap-2 items-center">
          <Input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button onClick={handleSubmit} loading={isPending}>
            {t('Import')}
          </Button>
        </div>
        {errorMessage && (
          <FormError formMessageId="import-flow-error-message" className="mt-4">
            {errorMessage}
          </FormError>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ImportFlowDialog };
