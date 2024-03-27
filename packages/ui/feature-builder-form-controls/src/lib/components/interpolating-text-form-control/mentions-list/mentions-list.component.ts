import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ActionType, TriggerType } from '@activepieces/shared';
import { MentionsTreeCacheService } from './mentions-tree-cache.service';
import {
  BuilderSelectors,
  StepWithIndex,
} from '@activepieces/ui/feature-builder-store';
import {
  BuilderAutocompleteMentionsDropdownService,
  InsertMentionOperation,
  MentionListItem,
} from '@activepieces/ui/common';
import { enrichMentionDropdownWithIcons } from '../utils';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

@Component({
  selector: 'app-mentions-list',
  templateUrl: './mentions-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsListComponent implements OnInit, AfterViewInit {
  searchFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  stepsMentions$: Observable<(MentionListItem & { step: StepWithIndex })[]>;
  expandConfigs = false;
  expandConnections = false;
  readonly ActionType = ActionType;
  readonly TriggerType = TriggerType;
  @ViewChild('searchInput', { read: ElementRef })
  searchInput: ElementRef;
  @Output()
  addMention: EventEmitter<InsertMentionOperation> = new EventEmitter();
  @Output()
  closeMenu: EventEmitter<void> = new EventEmitter();
  @Input()
  focusSearchInput$?: Observable<boolean>;
  constructor(
    private store: Store,
    private mentionsTreeCache: MentionsTreeCacheService,
    private pieceService: PieceMetadataService,
    public builderAutocompleteService: BuilderAutocompleteMentionsDropdownService
  ) {
    this.mentionsTreeCache.listSearchBarObs$ =
      this.searchFormControl.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        shareReplay(1)
      );
    this.stepsMentions$ = combineLatest({
      steps: this.store
        .select(BuilderSelectors.selectAllStepsForMentionsDropdown)
        .pipe(
          take(1),
          switchMap((steps) =>
            enrichMentionDropdownWithIcons(steps, this.pieceService)
          )
        ),
      search: this.mentionsTreeCache.listSearchBarObs$,
    }).pipe(
      map((res) => {
        return res.steps.filter(
          (item) =>
            item.label.toLowerCase().includes(res.search.toLowerCase()) ||
            this.mentionsTreeCache.searchForSubstringInKeyOrValue(
              item.step.name,
              res.search
            )
        );
      })
    );
  }
  ngAfterViewInit(): void {
    if (this.focusSearchInput$) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 1);
    }
  }
  ngOnInit(): void {
    if (this.focusSearchInput$) {
      this.focusSearchInput$ = this.focusSearchInput$.pipe(
        tap((val) => {
          if (val && this.searchInput) {
            this.searchInput?.nativeElement.focus();
          }
        })
      );
    }
  }
  mentionClicked(mention: MentionListItem) {
    this.addMention.emit({
      insert: {
        apMention: {
          serverValue: mention.value,
          value: mention.label,
          data: {
            logoUrl: mention.logoUrl,
          },
        },
      },
    });
  }
}
