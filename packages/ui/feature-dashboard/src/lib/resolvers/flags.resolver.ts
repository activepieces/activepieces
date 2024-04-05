import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { FlagService } from '@activepieces/ui/common';
export const FLAGS_RESOLVE_DATA = 'flags';
@Injectable({
  providedIn: 'root',
})
export class FlagsResolver {
  constructor(private flagService: FlagService) {}

  resolve(): Observable<Record<string, unknown>> {
    return this.flagService.getAllFlags();
  }
}
