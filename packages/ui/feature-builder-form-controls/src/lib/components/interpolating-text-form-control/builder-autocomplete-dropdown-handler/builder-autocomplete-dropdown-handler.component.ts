import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Observable, filter, map, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { flowHelper } from '@activepieces/shared';
import {
  BuilderAutocompleteMentionsDropdownService,
  InsertMentionOperation,
} from '@activepieces/ui/common';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { mentionsListId } from '../builder-autocomplete-mentions-dropdown/builder-autocomplete-mentions-dropdown.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-builder-autocomplete-dropdown-handler',
  templateUrl: './builder-autocomplete-dropdown-handler.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class BuilderAutocompleteDropdownHandlerComponent {
  static nextId = 0;
  id = BuilderAutocompleteDropdownHandlerComponent.nextId++;
  @Input() container: HTMLElement;
  @Input() currentInputCanHaveOnlyOneMention = false;
  @Output() mentionEmitted: EventEmitter<InsertMentionOperation> =
    new EventEmitter();
  listenToMentions$: Observable<{ id: number; insert: InsertMentionOperation }>;
  showDataInsertionPopup$: Observable<boolean>;
  constructor(
    private builderAutocompleteService: BuilderAutocompleteMentionsDropdownService,
    private store: Store,
    private cd: ChangeDetectorRef
  ) {
    this.listenToMentions$ = this.builderAutocompleteService.mentionEmitted
      .asObservable()
      .pipe(
        filter((res) => res.id === this.id),
        tap((res) => {
          this.mentionEmitted.emit(res.insert);
          document.getElementById(mentionsListId)?.focus();
        })
      );
  }
  showMentionsDropdown() {
    this.showDataInsertionPopup$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        map((step) => {
          if (step) return flowHelper.isTrigger(step.type);
          return true;
        }),
        tap((isTrigger) => {
          if (!isTrigger) {
            this.builderAutocompleteService.currentAutocompleteInputId$.next(
              this.id
            );
            this.builderAutocompleteService.currentAutoCompleteInputContainer$.next(
              this.container
            );
            this.builderAutocompleteService.currentInputCanHaveOnlyOneMention =
              this.currentInputCanHaveOnlyOneMention;
          }
        })
      );
    this.cd.markForCheck();
  }
}
