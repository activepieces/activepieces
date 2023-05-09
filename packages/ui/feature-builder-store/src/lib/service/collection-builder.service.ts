import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CollectionBuilderService {
  lastSuccessfulSaveDate = '';

  get unsavedNote() {
    return `Some changes are not saved due to disconnetion. Don't make new changes until your work is saved.
     ${this.lastSuccessfulSaveDate}`;
  }
}
