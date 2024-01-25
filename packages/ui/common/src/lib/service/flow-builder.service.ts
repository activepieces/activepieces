import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FlowBuilderService {
  private _loading$ = new Subject<boolean>();
  lastSuccessfulSaveDate = '';
  componentToShowInsidePortal$ = new ReplaySubject<
    ComponentPortal<unknown> | undefined
  >();
  savingStepOrTriggerData$: Observable<void> = of(void 0);
  get unsavedNote() {
    return `Some changes are not saved due to disconnetion. Don't make new changes until your work is saved.
     ${this.lastSuccessfulSaveDate}`;
  }
  get loading$() {
    return this._loading$.asObservable();
  }
  showLoading() {
    this._loading$.next(true);
  }
  hideLoading() {
    this._loading$.next(false);
  }
}
