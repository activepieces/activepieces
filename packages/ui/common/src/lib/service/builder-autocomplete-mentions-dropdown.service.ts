import { ElementRef } from '@angular/core';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { InsertMentionOperation } from '../utils/insert-mention-operation';

type DataInsertionPopupState = 'fullscreen' | 'docked' | 'collapse';

@Injectable({
  providedIn: 'root',
})
export class BuilderAutocompleteMentionsDropdownService {
  editStepSection?: ElementRef;
  currentAutoCompleteInputContainer$: BehaviorSubject<HTMLElement | null> =
    new BehaviorSubject<HTMLElement | null>(null);
  currentAutocompleteInputId$: BehaviorSubject<number | null> =
    new BehaviorSubject<number | null>(null);
  mentionEmitted: Subject<{
    id: number;
    insert: InsertMentionOperation;
  }> = new Subject();
  currentInputCanHaveOnlyOneMention = false;
  private _dataInsertionPopupSize$: BehaviorSubject<DataInsertionPopupState> =
    new BehaviorSubject<DataInsertionPopupState>('docked');
  public dataInsertionPopupSize$: Observable<DataInsertionPopupState> =
    this._dataInsertionPopupSize$.asObservable();
  private _lastDataInsertionPopupSize: 'docked' | 'fullscreen' = 'docked';
  public get lastDataInsertionPopupSize() {
    return this._lastDataInsertionPopupSize;
  }
  changeDataInsertionPopupSize(val: DataInsertionPopupState) {
    if (val !== 'collapse') {
      this._lastDataInsertionPopupSize = val;
    }
    this._dataInsertionPopupSize$.next(val);
  }
  revertDataInsertionPopupSize() {
    if (this._dataInsertionPopupSize$.value === 'collapse') {
      this._dataInsertionPopupSize$.next(this._lastDataInsertionPopupSize);
    }
  }
}
