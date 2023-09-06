import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TemplatesService } from '../service/templates.service';
import { Observable } from 'rxjs';

export const isThereAnyNewFeaturedTemplatesResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const service = inject(TemplatesService);
  return service.getIsThereNewFeaturedTemplates();
};

export const isThereAnyNewFeaturedTemplatesResolverKey =
  'isThereNewFeaturedTemplates';
