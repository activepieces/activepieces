import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import { useToast } from '@/components/ui/use-toast';
import { solutionsApi } from '@/features/solutions/lib/solutions-api';
import {
  ImportSolutionRequestBody,
  ImportSolutionResponse,
} from '@activepieces/shared';

export const solutionsHooks = {
  useImportSolution: (
    onSuccess?: (response: ImportSolutionResponse) => void,
  ) => {
    const { toast } = useToast();

    return useMutation({
      mutationFn: async (request: ImportSolutionRequestBody) => {
        return solutionsApi.import(request);
      },
      onSuccess: (response) => {
        onSuccess?.(response);
      },
      onError: (error) => {
        console.error('Failed to import solution:', error);
        toast({
          title: t('Error'),
          description: t('Failed to import solution. Please try again.'),
          variant: 'destructive',
          duration: 3000,
        });
      },
    });
  },
};
