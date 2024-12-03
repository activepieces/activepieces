import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { authenticationSession } from '@/lib/authentication-session';
import { FlowOperationType, FlowTemplate } from '@activepieces/shared';

import { LoadingSpinner } from '../../../components/ui/spinner';
import { PieceIconList } from '../../pieces/components/piece-icon-list';
import { templatesApi } from '../lib/templates-api';

const TemplateViewer = ({ template }: { template: FlowTemplate }) => {
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: template.name,
      });
      const updatedFlow = await flowsApi.update(flow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: template.template.displayName,
          trigger: template.template.trigger,
          schemaVersion: template.template.schemaVersion,
        },
      });
      return updatedFlow;
    },
    onSuccess: (data) => {
      navigate(`/flows/${data.id}`);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <Card className="min-w-[500px]">
      <>
        <CardHeader>
          <span className="font-semibold">{template.name}</span>
          <Separator />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 items-center justify-between mb-4">
              <div className="flex flex-row w-full justify-between items-center">
                <span>{t('Steps in this flow')}</span>
                <PieceIconList
                  trigger={template.template.trigger}
                  maxNumberOfIconsToShow={5}
                ></PieceIconList>
              </div>
              {template.description && (
                <>
                  <Separator className="my-2" />
                  <div className="flex flex-col w-full justify-start items-start">
                    <span className="font-semibold">{t('Description')}</span>
                    <span>{template.description}</span>
                  </div>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant={'secondary'} onClick={() => navigate('/flows')}>
                {t('Cancel')}
              </Button>
              <Button loading={isPending} onClick={() => mutate()}>
                {t('Import')}
              </Button>
            </div>
          </div>
        </CardContent>
      </>
    </Card>
  );
};

const ShareTemplate: React.FC<{ templateId: string }> = ({ templateId }) => {
  const { data } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templatesApi.getTemplate(templateId),
    staleTime: 0,
  });
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner size={50}></LoadingSpinner>
      </div>
    );
  }
  return <TemplateViewer template={data}></TemplateViewer>;
};

export { ShareTemplate };
