import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
import { fadeIn400ms } from '@activepieces/ui/common';
import { BuilderAutocompleteMentionsDropdownService } from './builder-autocomplete-mentions-dropdown.service';
import { InsertMentionOperation } from '../utils';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-builder-autocomplete-mentions-dropdown',
  templateUrl: './builder-autocomplete-mentions-dropdown.component.html',
  styleUrls: ['./builder-autocomplete-mentions-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class BuilderAutocompleteMentionsDropdownComponent {
  @ViewChild('mentionsList', { read: ElementRef }) mentionsList: ElementRef;
  @Output() addMention: EventEmitter<InsertMentionOperation> =
    new EventEmitter();
  @Output() menuClosed: EventEmitter<void> = new EventEmitter();
  showMenuSubject$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  showMenuObs$: Observable<boolean>;
  @Input() width = 'calc( 100% - 2.4rem )';
  @Input() left = 'unset';
  @Input() marginTop = '0px';
  calculatedMarginTop = '0px';
  id = new UUID();
  @Input() container: HTMLElement;

  closePressed = false;
  constructor(
    public interpolatingTextFormControlService: BuilderAutocompleteMentionsDropdownService,
    private store: Store,
    private cd: ChangeDetectorRef
  ) {
    this.showMenuObs$ = this.store.select(BuilderSelectors.selectViewMode).pipe(
      take(1),
      switchMap((val) => {
        if (val === ViewModeEnum.VIEW_INSTANCE_RUN) {
          return of(false);
        }
        return this.showMenuSubject$.asObservable().pipe(
          tap(() => {
            this.closePressed = false;
            this.interpolatingTextFormControlService.lastOpenDropdownId$.next(
              this.id
            );
            this.calculateDropdownOffset();
          })
        );
      })
    );
  }

  close() {
    this.menuClosed.emit();
    this.closePressed = true;
  }
  calculateDropdownOffset() {
    setTimeout(() => {
      if (
        this.mentionsList &&
        this.interpolatingTextFormControlService.lastOpenDropdownId$.value ===
          this.id
      ) {
        const containerRect = this.container.getBoundingClientRect();
        const MENTIONS_DROPDOWN_HEIGHT =
          this.mentionsList.nativeElement.getBoundingClientRect().height;
        const thereIsSpaceBeneath =
          window.innerHeight -
            containerRect.top -
            containerRect.height -
            MENTIONS_DROPDOWN_HEIGHT >
          0;
        if (!thereIsSpaceBeneath) {
          const marginInNumber = 5;
          this.calculatedMarginTop =
            (containerRect.height + marginInNumber + MENTIONS_DROPDOWN_HEIGHT) *
              -1 +
            'px';
        } else {
          this.calculatedMarginTop = this.marginTop;
        }
        this.cd.markForCheck();
      } else {
        this.calculatedMarginTop = this.marginTop;
      }
    }),
      100;
  }
}
