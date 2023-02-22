import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { fadeIn400ms } from '../../../../animation/fade-in.animations';
import { BuilderAutocompleteMentionsDropdownService } from './builder-autocomplete-mentions-dropdown.service';
import { InsertMentionOperation } from '../utils';

@Component({
  selector: 'app-builder-autocomplete-mentions-dropdown',
  templateUrl: './builder-autocomplete-mentions-dropdown.component.html',
  styleUrls: ['./builder-autocomplete-mentions-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class BuilderAutocompleteMentionsDropdownComponent {
  @Output() addMention: EventEmitter<InsertMentionOperation> =
    new EventEmitter();
  @Output() menuClosed: EventEmitter<void> = new EventEmitter();
  showMenuSubject$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  showMenuObs$: Observable<boolean> = this.showMenuSubject$.asObservable().pipe(
    tap(() => {
      this.closePressed = false;
      this.interpolatingTextFormControlService.lastOpenDropdownId$.next(
        this.id
      );
    })
  );
  @Input() width = 'calc( 100% - 2rem )';
  @Input() left = 'unset';
  @Input() marginTop = '0px';
  closePressed = false;
  constructor(
    public interpolatingTextFormControlService: BuilderAutocompleteMentionsDropdownService
  ) { }
  id = new UUID();
}
