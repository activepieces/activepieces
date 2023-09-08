import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TemplatesService } from '../service/templates.service';
import { Observable, catchError, of } from 'rxjs';

export const isThereAnyNewFeaturedTemplatesResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const service = inject(TemplatesService);
  return service.getIsThereNewFeaturedTemplates().pipe(
    catchError((err) => {
      console.error(err);
      return of(false);
    })
  );
};

export const isThereAnyNewFeaturedTemplatesResolverKey =
  'isThereNewFeaturedTemplates';
