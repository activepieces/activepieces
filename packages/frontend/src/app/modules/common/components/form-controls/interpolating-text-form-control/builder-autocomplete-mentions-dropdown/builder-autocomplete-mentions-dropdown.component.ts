import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
import { fadeIn400ms } from '@activepieces/ui/common';
import { BuilderAutocompleteMentionsDropdownService } from './builder-autocomplete-mentions-dropdown.service';
import { InsertMentionOperation } from '../utils';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../../flow-builder/store/builder/builder.selector';
import { ViewModeEnum } from '../../../../../flow-builder/store/model/enums/view-mode.enum';

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
  showMenuObs$: Observable<boolean>;
  @Input() width = 'calc( 100% - 2.4rem )';
  @Input() left = 'unset';
  @Input() marginTop = '0px';
  id = new UUID();
  closePressed = false;
  constructor(
    public interpolatingTextFormControlService: BuilderAutocompleteMentionsDropdownService,
    private store: Store
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
          })
        );
      })
    );
  }
}
