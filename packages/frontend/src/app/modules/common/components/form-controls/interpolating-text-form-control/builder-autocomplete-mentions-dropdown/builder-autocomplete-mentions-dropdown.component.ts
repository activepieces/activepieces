import { ChangeDetectionStrategy, Component, EventEmitter,  Input,  Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fadeIn400ms } from '../../../../animation/fade-in.animations';
import { InsertMentionOperation } from '../utils';


@Component({
  selector: 'app-builder-autocomplete-mentions-dropdown',
  templateUrl: './builder-autocomplete-mentions-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations:[fadeIn400ms]
})
export class BuilderAutocompleteMentionsDropdownComponent {
  @Output() addMention : EventEmitter<InsertMentionOperation>= new EventEmitter();
  @Output() menuClosed:EventEmitter<void> = new EventEmitter();
  editorFocused$:BehaviorSubject<boolean>=new BehaviorSubject(false);
  @Input() width:string="90%";
  @Input() left:string= "unset";
  searchInputIsFocused=false;
 }
