import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { LoadingSpinner } from '@/components/ui/spinner';
import { ApForm } from '@/features/forms/components/ap-form';
import { formsApi } from '@/features/forms/lib/forms-api';
import { FormResponse, isNil } from '@activepieces/shared';

export const FormPage = () => {
  const { flowId } = useParams();
  const useDraft = useSearchParam('useDraft');

  const {
    data: form,
    isLoading,
    isError,
  } = useQuery<FormResponse | null, Error>({
    queryKey: ['form', flowId],
    queryFn: () => formsApi.get(flowId!, useDraft === 'true'),
    enabled: !isNil(flowId),
    staleTime: Infinity,
  });

  return (
    <>
      {isLoading && (
        <div className="bg-background flex h-screen w-screen items-center justify-center ">
          <LoadingSpinner size={50}></LoadingSpinner>
        </div>
      )}
      {isError && <Navigate to="/404" />}

      {form && !isLoading && (
        <ApForm form={form} useDraft={useDraft === 'true'} />
      )}
    </>
  );
};
