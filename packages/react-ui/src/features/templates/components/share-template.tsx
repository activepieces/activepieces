import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';
import {
  ApErrorParams,
  ErrorCode,
  isNil,
  Template,
} from '@activepieces/shared';

import { PieceIconList } from '../../pieces/components/piece-icon-list';

const TemplateViewer = ({ template }: { template: Template }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = authenticationSession.getToken();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const flows = await flowHooks.importFlowsFromTemplates({
        templates: [template],
        projectId: authenticationSession.getProjectId()!,
      });
      return flows[0];
    },
    onSuccess: (data) => {
      navigate(`/flows/${data.id}`);
    },
    onError: (error) => {
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        if (apError.code === ErrorCode.PERMISSION_DENIED) {
          toast.error(t('Import Failed'), {
            description: t("You don't have permission to import this template"),
            duration: 3000,
          });
          return;
        }
      }
      internalErrorToast();
    },
  });

  const handleUseTemplate = () => {
    if (isNil(token)) {
      navigate(
        `/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`,
      );
      return;
    }
    mutate();
  };

  return (
    <Card className="min-w-[500px] shadow-lg border-2">
      <>
        <CardHeader className="space-y-3 pb-4">
          <h2 className="text-2xl font-bold tracking-tight">{template.name}</h2>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-row w-full justify-between items-center py-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t('Steps in this flow')}
              </span>
              {template.flows?.[0]?.trigger && (
                <PieceIconList
                  trigger={template.flows[0].trigger}
                  maxNumberOfIconsToShow={5}
                />
              )}
            </div>
            {template.description && (
              <>
                <Separator />
                <div className="space-y-2 py-2">
                  <h3 className="text-sm font-semibold">{t('Description')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-end pt-2">
            <Button loading={isPending} onClick={handleUseTemplate} size="lg">
              {t('Use Template')}
            </Button>
          </div>
        </CardContent>
      </>
    </Card>
  );
};

const ShareTemplate: React.FC<{ template: Template }> = ({ template }) => {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="w-full max-w-2xl">
        <TemplateViewer template={template} />
      </div>
    </div>
  );
};

export { ShareTemplate };
