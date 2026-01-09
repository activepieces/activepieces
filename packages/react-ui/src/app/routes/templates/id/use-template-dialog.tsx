import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ApProjectDisplay } from '@/app/components/ap-project-display';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowOperationType,
  PopulatedFlow,
  Template,
  UncategorizedFolderId,
  isNil,
} from '@activepieces/shared';

type UseTemplateDialogProps = {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UseTemplateDialog = ({
  template,
  open,
  onOpenChange,
}: UseTemplateDialogProps) => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  const { data: projects } = projectCollectionUtils.useAll();
  const { folders } = foldersHooks.useFolders();

  useEffect(() => {
    if (open) {
      const currentProjectId = authenticationSession.getProjectId();
      if (currentProjectId) {
        setSelectedProjectId(currentProjectId);
      } else if (projects && projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      }
      setSelectedFolderId(UncategorizedFolderId);
    }
  }, [open, projects]);

  const { mutate: createFlow, isPending } = useMutation<
    PopulatedFlow[],
    Error,
    { projectId: string; folderId: string }
  >({
    mutationFn: async ({ projectId, folderId }) => {
      const flows = template.flows || [];
      const hasMultipleFlows = flows.length > 1;

      let folderName: string | undefined;

      if (hasMultipleFlows) {
        const newFolder = await foldersApi.create({
          displayName: template.name,
          projectId: projectId,
        });
        folderName = newFolder.displayName;
      } else if (!isNil(folderId) && folderId !== UncategorizedFolderId) {
        const folder = await foldersApi.get(folderId);
        folderName = folder.displayName;
      }

      return Promise.all(
        flows.map(async (flowTemplate) => {
          const newFlow = await flowsApi.create({
            displayName: flowTemplate.displayName,
            projectId: projectId,
            folderName: folderName,
          });

          return flowsApi.update(newFlow.id, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
              displayName: flowTemplate.displayName,
              trigger: flowTemplate.trigger,
              schemaVersion: flowTemplate.schemaVersion,
            },
          });
        }),
      );
    },
    onSuccess: (flows) => {
      onOpenChange(false);
      if (flows.length === 1) {
        toast.success(t('Flow created successfully'));
        navigate(`/flows/${flows[0].id}`);
      } else {
        toast.success(
          t('{count} flows created successfully in a new folder', {
            count: flows.length,
          }),
        );
        navigate(`/flows`);
      }
    },
    onError: (error) => {
      toast.error(t('Failed to create flow from template'));
      console.error('Error creating flow:', error);
    },
  });

  const handleConfirmUseTemplate = () => {
    if (!selectedProjectId) {
      toast.error(t('Please select a project'));
      return;
    }
    createFlow({ projectId: selectedProjectId, folderId: selectedFolderId });
  };

  const flowCount = template.flows?.length || 0;
  const hasMultipleFlows = flowCount > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Use Template')}</DialogTitle>
          <DialogDescription>
            {hasMultipleFlows
              ? t(
                  'This template includes {count} flows with all dependencies. A new folder will be created to organize them.',
                  { count: flowCount },
                )
              : t(
                  'Select the project and folder where you want to use this template.',
                )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project">{t('Project')}</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder={t('Select a project')} />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <ApProjectDisplay
                      title={project.displayName}
                      icon={project.icon}
                      projectType={project.type}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!hasMultipleFlows && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="folder">{t('Folder')}</Label>
              <Select
                value={selectedFolderId}
                onValueChange={setSelectedFolderId}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder={t('Select a folder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UncategorizedFolderId}>
                    {t('Uncategorized')}
                  </SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirmUseTemplate}
            loading={isPending}
            disabled={!selectedProjectId}
          >
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
