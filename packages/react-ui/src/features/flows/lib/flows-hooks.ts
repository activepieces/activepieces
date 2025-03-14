import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import { ListFlowsRequest, PopulatedFlow } from '@activepieces/shared';

import { flowsApi } from './flows-api';
import { flowsUtils } from './flows-utils';

export const flowsHooks = {
  useFlows: (request: Omit<ListFlowsRequest, 'projectId'>) => {
    return useQuery({
      queryKey: ['flows', authenticationSession.getProjectId()],
      queryFn: async () => {
        return await flowsApi.list({
          ...request,
          projectId: authenticationSession.getProjectId()!,
        });
      },
      staleTime: 5 * 1000,
    });
  },
  useExportFlows: () => {
    return useMutation({
      mutationFn: async (flows: PopulatedFlow[]) => {
        if (flows.length === 0) {
          return flows;
        }
        if (flows.length === 1) {
          await flowsUtils.downloadFlow(flows[0].id);
          return flows;
        }
        const zip = await flowsUtils.downloadFlowsIntoZip(flows);
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'flows.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return flows;
      },
      onSuccess: (res) => {
        if (res.length > 0) {
          toast({
            title: t('Success'),
            description:
              res.length === 1
                ? t(`${res[0].version.displayName} has been exported.`)
                : t('Flows have been exported.'),
            duration: 3000,
          });
        }
      },
      onError: () => toast(INTERNAL_ERROR_TOAST),
    });
  },
};
