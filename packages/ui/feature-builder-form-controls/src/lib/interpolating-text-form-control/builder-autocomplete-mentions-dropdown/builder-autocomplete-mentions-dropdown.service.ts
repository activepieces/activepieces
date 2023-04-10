import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BuilderAutocompleteMentionsDropdownService {
  lastOpenDropdownId$: Subject<UUID> = new Subject();
}
