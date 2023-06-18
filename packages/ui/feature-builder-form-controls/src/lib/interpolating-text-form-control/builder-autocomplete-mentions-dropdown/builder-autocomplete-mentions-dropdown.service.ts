import { ElementRef } from '@angular/core';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { InsertMentionOperation } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class BuilderAutocompleteMentionsDropdownService {
  editStepSection?: ElementRef;
  currentAutocompleteInputId$: BehaviorSubject<undefined | number> =
    new BehaviorSubject(undefined);
  mentionEmitted: Subject<{
    id: number;
    insert: InsertMentionOperation;
  }> = new Subject();
}
