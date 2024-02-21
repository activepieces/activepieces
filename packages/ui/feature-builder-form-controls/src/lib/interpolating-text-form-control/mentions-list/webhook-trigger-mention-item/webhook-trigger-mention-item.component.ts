import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TriggerType, WebhookTrigger } from '@activepieces/shared';
import {
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { map, Observable, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  CustomPathMentionDialogComponent,
  CustomPathMentionDialogData,
} from '../custom-path-mention-dialog/custom-path-mention-dialog.component';
import { Step, canvasActions } from '@activepieces/ui/feature-builder-store';
import { MentionListItem } from '@activepieces/ui/common';

@Component({
  selector: 'app-webhook-trigger-mention-item',
  templateUrl: './webhook-trigger-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebhookTriggerMentionItemComponent implements OnInit {
  expandSample = false;
  sampleData: MentionTreeNode[] | undefined = undefined;
  nodesFilteredWithSearch$: Observable<Map<string, boolean>>;
  @Input()
  set stepMention(val: MentionListItem & { step: Step }) {
    if (val.step.type !== TriggerType.WEBHOOK) {
      throw new Error('Step is not a webhook trigger');
    }
    this._stepMention = val as MentionListItem & { step: WebhookTrigger };
  }
  @Input() stepIndex: number;
  @Output() mentionEmitted: EventEmitter<MentionListItem> = new EventEmitter();
  customPathDialogClosed$: Observable<MentionListItem | undefined>;
  _stepMention: MentionListItem & { step: WebhookTrigger };
  pathFormGroup: FormGroup<{ path: FormControl<string> }>;
  search$: Observable<string>;
  constructor(
    private dialogService: MatDialog,
    private mentionsTreeCache: MentionsTreeCacheService,
    private store: Store
  ) {}
  ngOnInit(): void {
    this.sampleData = traverseStepOutputAndReturnMentionTree(
      this._stepMention.step.settings.inputUiInfo.currentSelectedData,
      this._stepMention.step.name,
      this._stepMention.step.displayName
    ).children;
    if (this.sampleData) {
      this.mentionsTreeCache.setStepMentionsTree(this._stepMention.step.name, {
        children: this.sampleData,
      });
    }
    this.search$ = this.mentionsTreeCache.listSearchBarObs$.pipe(
      tap((res) => {
        this.expandSample = !!res;
      })
    );
    this.nodesFilteredWithSearch$ =
      this.mentionsTreeCache.listSearchBarObs$.pipe(
        map((res) => {
          const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
            this._stepMention.step.name,
            res
          );
          return markedNodesToShow;
        })
      );
  }

  openPathDialog() {
    const dialogData: CustomPathMentionDialogData = {
      defaultValue: 'trigger',
      dialogTitle: 'Webhook Payload Path',
      entityName: 'webhook payload',
      placeHolder: 'eg. trigger.headers',
      stepDisplayName: this._stepMention.step.displayName,
      stepName: 'trigger',
    };
    this.customPathDialogClosed$ = this.dialogService
      .open(CustomPathMentionDialogComponent, { data: dialogData })
      .afterClosed()
      .pipe(
        tap((val) => {
          if (val) {
            this.mentionEmitted.emit(val);
          }
        })
      );
  }
  selectStep() {
    this.store.dispatch(
      canvasActions.selectStepByName({ stepName: this._stepMention.step.name })
    );
  }
}
