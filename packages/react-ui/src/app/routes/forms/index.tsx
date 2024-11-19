import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { LoadingSpinner } from '@/components/ui/spinner';
import { ApForm } from '@/features/human-input/components/ap-form';
import { humanInputApi } from '@/features/human-input/lib/human-input-api';
import {
  FormResponse,
  isNil,
  USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared';

import NotFoundPage from '../404-page';

export const FormPage = () => {
  const { flowId } = useParams();
  const useDraft = useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';

  const {
    data: form,
    isLoading,
    isError,
  } = useQuery<FormResponse | null, Error>({
    queryKey: ['form', flowId],
    queryFn: () => humanInputApi.getForm(flowId!, useDraft),
    enabled: !isNil(flowId),
    retry: false,
    staleTime: Infinity,
  });

  return (
    <>
      {isLoading && (
        <div className="bg-background flex h-screen w-screen items-center justify-center ">
          <LoadingSpinner size={50}></LoadingSpinner>
        </div>
      )}
      {isError && (
        <NotFoundPage
          title="Hmm... this form isn't here"
          description="The form you're looking for isn't here or maybe hasn't been published by the owner yet"
        />
      )}

      {form && !isLoading && <ApForm form={form} useDraft={useDraft} />}
    </>
  );
};
