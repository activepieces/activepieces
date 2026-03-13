import { isNil, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { ApForm, formsQueries } from '@/features/forms';

import NotFoundPage from '../404-page';

export const FormPage = () => {
  const { flowId } = useParams();
  const useDraft = useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';

  const {
    data: form,
    isLoading,
    isError,
  } = formsQueries.useForm(flowId!, useDraft, !isNil(flowId));

  return (
    <>
      {isLoading && <LoadingScreen />}
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
