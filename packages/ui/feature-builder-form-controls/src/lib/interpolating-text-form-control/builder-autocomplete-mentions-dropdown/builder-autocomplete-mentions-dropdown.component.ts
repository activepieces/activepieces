import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';

import { Observable, of, switchMap, take, tap, map } from 'rxjs';
import { fadeIn400ms } from '@activepieces/ui/common';
import { BuilderAutocompleteMentionsDropdownService } from './builder-autocomplete-mentions-dropdown.service';
import { InsertMentionOperation } from '../utils';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-builder-autocomplete-mentions-dropdown',
  templateUrl: './builder-autocomplete-mentions-dropdown.component.html',
  styleUrls: ['./builder-autocomplete-mentions-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class BuilderAutocompleteMentionsDropdownComponent {
  @ViewChild('mentionsList', { read: ElementRef }) mentionsList:
    | ElementRef<HTMLDivElement>
    | undefined;
  showMenuObs$: Observable<boolean>;
  @Input() focusSearch = false;
  @Input() mouseWithin = false;
  @Input() id: number;
  @Input() container: HTMLElement;
  focusChecker: NodeJS.Timer;
  constructor(
    private interpolatingTextFormControlService: BuilderAutocompleteMentionsDropdownService,
    private store: Store,
    private matDialog: MatDialog
  ) {
    this.showMenuObs$ = this.store.select(BuilderSelectors.selectViewMode).pipe(
      take(1),
      switchMap((val) => {
        if (val === ViewModeEnum.VIEW_INSTANCE_RUN) {
          return of(false);
        }
        return this.interpolatingTextFormControlService.currentAutocompleteInputId$
          .asObservable()
          .pipe(
            map((val) => {
              return val !== null;
            }),
            tap((val) => {
              if (val) {
                this.setFocusChecker();
              }
            })
          );
      })
    );
  }
  mentionEmitted(mention: InsertMentionOperation) {
    this.interpolatingTextFormControlService.mentionEmitted.next({
      id: this.interpolatingTextFormControlService.currentAutocompleteInputId$
        .value!,
      insert: mention,
    });
  }
  private setFocusChecker() {
    if (this.focusChecker) {
      clearInterval(this.focusChecker);
    }
    this.focusChecker = setInterval(() => {
      console.log(
        this.interpolatingTextFormControlService.currentAutoCompleteInputContainer$.value?.matches(
          ':focus-within'
        )
      );
      if (
        !this.interpolatingTextFormControlService
          .currentAutoCompleteInputContainer$.value ||
        (!this.interpolatingTextFormControlService.currentAutoCompleteInputContainer$.value.matches(
          ':focus-within'
        ) &&
          !this.interpolatingTextFormControlService
            .currentInputCanHaveOnlyOneMention &&
          this.matDialog.openDialogs.length === 0 &&
          !this.mouseWithin)
      ) {
        clearInterval(this.focusChecker);
        this.close();
      }
    }, 100);
  }

  close() {
    this.interpolatingTextFormControlService.currentAutocompleteInputId$.next(
      null
    );
    this.interpolatingTextFormControlService.currentAutoCompleteInputContainer$.next(
      null
    );
  }
}
