import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import {
  FormResponse,
  TelemetryEventName,
  USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared';
import { FormsService } from './forms.service';
import { catchError, tap } from 'rxjs';
import { TelemetryService } from '@activepieces/ui/common';
import { isNil } from 'lodash';
export const FORMS_RESOLVE_DATA = 'FORM';
export const FormsResolver: ResolveFn<FormResponse> = (route) => {
  const formsService = inject(FormsService);
  const telemteryService = inject(TelemetryService);
  const router = inject(Router);
  const flowId = route.paramMap.get('flowId');
  if (!flowId) {
    throw new Error('Flow id is missing');
  }
  const draftQueryParam = route.queryParams[USE_DRAFT_QUERY_PARAM_NAME];
  const useDraft =
    !isNil(draftQueryParam) && draftQueryParam.toLowerCase() === 'true';
  return formsService.get(flowId, useDraft).pipe(
    tap((form) => {
      telemteryService.capture({
        name: TelemetryEventName.FORMS_VIEWED,
        payload: {
          flowId: form.id,
          formProps: form.props,
          projectId: form.projectId,
        },
      });
    }),
    catchError((err) => {
      console.error(err);
      router.navigate(['/not-found']);
      throw err;
    })
  );
};
