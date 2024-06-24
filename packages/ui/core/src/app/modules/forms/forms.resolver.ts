import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { FormResponse, TelemetryEventName } from '@activepieces/shared';
import { FormsService } from './forms.service';
import { catchError, tap } from 'rxjs';
import { TelemetryService } from '@activepieces/ui/common';
export const FORMS_RESOLVE_DATA = 'FORM';
export const FormsResolver: ResolveFn<FormResponse> = (route) => {
    const formsService = inject(FormsService);
    const telemteryService = inject(TelemetryService);
    const router = inject(Router);
    return formsService.get(route.paramMap.get('flowId') as string)
    .pipe(tap((form) => {
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
      }))
};
