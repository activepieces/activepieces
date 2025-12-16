import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import JSZip from 'jszip';
import { TriangleAlert } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/telemetry-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select';
import { internalErrorToast } from '@/components/ui/sonner';
import { LoadingSpinner } from '@/components/ui/spinner';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowOperationType,
  isNil,
  PopulatedFlow,
  TelemetryEventName,
  UncategorizedFolderId,
  Template,
} from '@activepieces/shared';

import { FormError } from '../../../components/ui/form';
import { flowsApi } from '../lib/flows-api';
import { templateUtils } from '../lib/template-parser';

export type ImportFlowDialogProps =
  | {
      insideBuilder: false;
      onRefresh: () => void;
      folderId: string;
    }
  | {
      insideBuilder: true;
      flowId: string;
    };

const readTemplateJson = async (
  templateFile: File,
): Promise<Template | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const template = templateUtils.parseTemplate(reader.result as string);
      resolve(template);
    };
    reader.readAsText(templateFile);
  });
};

const ImportFlowDialog = (
  props: ImportFlowDialogProps & { children: React.ReactNode },
) => {
  const { capture } = useTelemetry();
  const [templates, setTemplates] = useState<Template[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    props.insideBuilder ? undefined : props.folderId,
  );

  const { folders, isLoading } = foldersHooks.useFolders();

  const navigate = useNavigate();

  const { mutate: importFlows, isPending } = useMutation<
    PopulatedFlow[],
    Error,
    Template[]
  >({
    mutationFn: async (templates: Template[]) => {
      const importPromises = templates.flatMap(async (template) => {
        const flowImportPromises = (template.flows || []).map(
          async (templateFlow) => {
            let flow: PopulatedFlow | null = null;
            if (props.insideBuilder) {
              flow = await flowsApi.get(props.flowId);
            } else {
              const folder =
                !isNil(selectedFolderId) &&
                selectedFolderId !== UncategorizedFolderId
                  ? await foldersApi.get(selectedFolderId)
                  : undefined;
              flow = await flowsApi.create({
                displayName: templateFlow.displayName,
                projectId: authenticationSession.getProjectId()!,
                folderName: folder?.displayName,
              });
            }
            return await flowsApi.update(flow.id, {
              type: FlowOperationType.IMPORT_FLOW,
              request: {
                displayName: templateFlow.displayName,
                trigger: templateFlow.trigger,
                schemaVersion: templateFlow.schemaVersion,
              },
            });
          },
        );

        return Promise.all(flowImportPromises);
      });

      const results = await Promise.all(importPromises);
      return results.flat();
    },

    onSuccess: (flows: PopulatedFlow[]) => {
      capture({
        name: TelemetryEventName.FLOW_IMPORTED_USING_FILE,
        payload: {
          location: props.insideBuilder
            ? 'inside the builder'
            : 'inside dashboard',
          multiple: flows.length > 1,
        },
      });
      templatesApi.incrementUsageCount(templates[0].id);

      toast.success(
        t(`flowsImported`, {
          flowsCount: flows.length,
        }),
      );

      if (flows.length === 1) {
        navigate(`/flows/${flows[0].id}`);
        return;
      }
      setIsDialogOpen(false);
      if (flows.length === 1 || props.insideBuilder) {
        navigate(`/flow-import-redirect/${flows[0].id}`);
      }
      if (!props.insideBuilder) {
        props.onRefresh();
      }
    },
    onError: (err) => {
      if (
        api.isError(err) &&
        err.response?.status === HttpStatusCode.BadRequest
      ) {
        setErrorMessage(t('Template file is invalid'));
        console.log(err);
      } else {
        internalErrorToast();
      }
    },
  });

  const handleSubmit = async () => {
    if (templates.length === 0) {
      setErrorMessage(
        failedFiles.length
          ? t(
              'No valid templates found. The following files failed to import: ',
            ) + failedFiles.join(', ')
          : t('Please select a file first'),
      );
    } else {
      setErrorMessage('');
      importFlows(templates);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files?.[0]) return;

    setTemplates([]);
    setFailedFiles([]);
    setErrorMessage('');
    const file = files[0];
    const newTemplates: Template[] = [];
    const isZipFile =
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed';
    if (isZipFile && !props.insideBuilder) {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const jsonFiles = Object.keys(zipContent.files).filter((fileName) =>
        fileName.endsWith('.json'),
      );

      for (const fileName of jsonFiles) {
        const fileData = await zipContent.files[fileName].async('string');
        const template = await readTemplateJson(new File([fileData], fileName));
        if (template) {
          newTemplates.push(template);
        } else {
          setFailedFiles((prevFailedFiles) => [...prevFailedFiles, fileName]);
        }
      }
    } else if (file.type === 'application/json') {
      const template = await readTemplateJson(file);
      if (template) {
        newTemplates.push(template);
      } else {
        setFailedFiles((prevFailedFiles) => [...prevFailedFiles, file.name]);
      }
    } else {
      setErrorMessage(t('Unsupported file type'));
      return;
    }
    setTemplates(newTemplates);
  };
  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setErrorMessage('');
          setTemplates([]);
          setFailedFiles([]);
        }
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
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-col gap-2 justify-between items-start">
            <span className="w-16 text-sm font-medium text-gray-700">
              {t('Flow')}
            </span>
            <Input
              id="file-input"
              type="file"
              accept={props.insideBuilder ? '.json' : '.json,.zip'}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          {!props.insideBuilder && (
            <div className="w-full flex flex-col gap-2 justify-between items-start">
              <span className="w-16 text-sm font-medium text-gray-700">
                {t('Folder')}
              </span>
              {isLoading ? (
                <div className="flex justify-center items-center w-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <Select
                  onValueChange={(value) => setSelectedFolderId(value)}
                  defaultValue={selectedFolderId}
                >
                  <SelectTrigger>
                    <SelectValue
                      defaultValue={selectedFolderId}
                      placeholder={t('Select a folder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Folders')}</SelectLabel>
                      <SelectItem value={UncategorizedFolderId}>
                        {t('Uncategorized')}
                      </SelectItem>
                      {folders?.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.displayName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
        {errorMessage && (
          <FormError formMessageId="import-flow-error-message" className="mt-4">
            {errorMessage}
          </FormError>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {t('Import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ImportFlowDialog };
