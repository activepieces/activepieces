import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CollectionBuilderService {
  lastSuccessfulSaveDate = '';
  componentToShowInsidePortal$ = new Subject<
    ComponentPortal<unknown> | undefined
  >();
  get unsavedNote() {
    return `Some changes are not saved due to disconnetion. Don't make new changes until your work is saved.
     ${this.lastSuccessfulSaveDate}`;
  }
}
