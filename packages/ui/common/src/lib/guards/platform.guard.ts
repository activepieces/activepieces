import { CanActivateFn } from '@angular/router';
import { of } from 'rxjs';

export const platformGuard: CanActivateFn = () => {
  return showPlatform$;
};

export const showPlatform$ = of(true);
