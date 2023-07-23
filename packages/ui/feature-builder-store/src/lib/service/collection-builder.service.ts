import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { FlowId, FlowTemplate } from '@activepieces/shared';

@Injectable({ providedIn: 'root' })
export class CollectionBuilderService {
  lastSuccessfulSaveDate = '';
  importTemplate$: Subject<{ template: FlowTemplate; flowId: FlowId }> =
    new Subject();
  componentToShowInsidePortal$ = new ReplaySubject<
    ComponentPortal<unknown> | undefined
  >();
  get unsavedNote() {
    return `Some changes are not saved due to disconnetion. Don't make new changes until your work is saved.
     ${this.lastSuccessfulSaveDate}`;
  }
}
