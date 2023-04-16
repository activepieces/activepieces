import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BuilderAutocompleteMentionsDropdownService {
  lastOpenDropdownId$: BehaviorSubject<UUID> = new BehaviorSubject(new UUID());
}
