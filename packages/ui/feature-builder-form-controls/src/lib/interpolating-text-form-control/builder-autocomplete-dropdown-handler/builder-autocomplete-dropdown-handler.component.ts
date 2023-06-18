import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { BuilderAutocompleteMentionsDropdownService } from '../builder-autocomplete-mentions-dropdown/builder-autocomplete-mentions-dropdown.service';
import { InsertMentionOperation } from '../utils';
import { Observable, filter, tap } from 'rxjs';

@Component({
  selector: 'app-builder-autocomplete-dropdown-handler',
  templateUrl: './builder-autocomplete-dropdown-handler.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderAutocompleteDropdownHandlerComponent {
  static nextId = 0;
  id = BuilderAutocompleteDropdownHandlerComponent.nextId++;
  @Input() container: HTMLElement;
  @Output() mentionEmitted: EventEmitter<InsertMentionOperation> =
    new EventEmitter();
  listenToMentions$: Observable<{ id: number; insert: InsertMentionOperation }>;
  constructor(
    private builderAutocompleteService: BuilderAutocompleteMentionsDropdownService
  ) {
    this.listenToMentions$ = this.builderAutocompleteService.mentionEmitted
      .asObservable()
      .pipe(
        filter((res) => res.id === this.id),
        tap((res) => this.mentionEmitted.emit(res.insert))
      );
  }
  showMentionsDropdown() {
    this.builderAutocompleteService.currentAutocompleteInputId$.next(this.id);
    this.builderAutocompleteService.currentAutoCompleteInputContainer$.next(
      this.container
    );
  }
}
