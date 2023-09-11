import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TemplatesService } from '../service/templates.service';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { TelemetryService } from '../service/telemetry.service';

export const isThereAnyNewFeaturedTemplatesResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const templatesService = inject(TemplatesService);
  const telemetryService = inject(TelemetryService);
  return templatesService.getIsThereNewFeaturedTemplates().pipe(
    switchMap((thereAreNewFeaturedTemplates) => {
      return telemetryService
        .isFeatureEnabled('FeaturedTemplates')
        .pipe(map((res) => res && thereAreNewFeaturedTemplates));
    }),
    catchError((err) => {
      console.error(err);
      return of(false);
    })
  );
};

export const isThereAnyNewFeaturedTemplatesResolverKey =
  'isThereNewFeaturedTemplates';
