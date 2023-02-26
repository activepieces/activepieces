import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, take } from 'rxjs';
import { BuilderSelectors } from '../modules/flow-builder/store/builder/builder.selector';

@Injectable({
  providedIn: 'root',
})
export class BuilderSavingGuard implements CanDeactivate<any> {
  constructor(private store: Store) {}
  canDeactivate(): Observable<boolean> {
    const isSaving$ = this.store.select(BuilderSelectors.selectIsSaving);
    return isSaving$.pipe(
      map((saving: boolean) => {
        if (!saving) return true;
        else
          return confirm(
            'You have unsaved changes on this page, are you sure you want to leave?'
          );
      }),
      take(1)
    );
  }
}
