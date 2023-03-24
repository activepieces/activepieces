import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
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
  take,
} from 'rxjs';
import { ActionType, TriggerType } from '@activepieces/shared';
import { InsertMentionOperation, MentionListItem } from '../utils';
import { MentionsTreeCacheService } from './mentions-tree-cache.service';
import { FlowItem } from '../../../../model/flow-builder/flow-item';
import { BuilderSelectors } from '../../../../../flow-builder/store/builder/builder.selector';

@Component({
  selector: 'app-mentions-list',
  templateUrl: './mentions-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsListComponent {
  searchFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  stepsMentions$: Observable<(MentionListItem & { step: FlowItem })[]>;
  connectionsMentions$: Observable<MentionListItem[]>;
  expandConfigs = false;
  expandConnections = false;
  @Output()
  searchInputFocused: EventEmitter<boolean> = new EventEmitter();
  readonly ActionType = ActionType;
  readonly TriggerType = TriggerType;
  @Output()
  addMention: EventEmitter<InsertMentionOperation> = new EventEmitter();
  @Output()
  closeMenu: EventEmitter<void> = new EventEmitter();
  constructor(
    private store: Store,
    private mentionsTreeCache: MentionsTreeCacheService
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
        .pipe(take(1)),
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
    this.connectionsMentions$ = combineLatest({
      connections: this.store
        .select(BuilderSelectors.selectAppConnectionsForMentionsDropdown)
        .pipe(take(1)),
      search: this.mentionsTreeCache.listSearchBarObs$,
    }).pipe(
      map((res) => {
        return res.connections.filter((item) =>
          item.label.toLowerCase().includes(res.search.toLowerCase())
        );
      }),
      shareReplay(1)
    );
  }
  mentionClicked(mention: MentionListItem) {
    this.addMention.emit({
      insert: {
        mention: {
          serverValue: mention.value,
          value: mention.label,
          denotationChar: '',
        },
      },
    });
  }
}
