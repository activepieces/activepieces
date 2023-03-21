import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TriggerType, WebhookTrigger } from '@activepieces/shared';
import {
  MentionListItem,
  MentionTreeNode,
  replaceArrayNotationsWithSpaces,
  replaceDotsWithSpaces,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { FlowItem } from '../../../../../model/flow-builder/flow-item';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { map, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { FlowsActions } from '../../../../../../flow-builder/store/flow/flows.action';

const pathRegex = /\$\{trigger((\.[a-zA-Z_$][a-zA-Z_$0-9]*)(\[([0-9])+\])*)*\}/;
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
  set stepMention(val: MentionListItem & { step: FlowItem }) {
    if (val.step.type !== TriggerType.WEBHOOK) {
      throw new Error('Step is not a webhook trigger');
    }
    this._stepMention = val as MentionListItem & { step: WebhookTrigger };
  }
  @Input() stepIndex: number;
  @Output() mentionEmitted: EventEmitter<MentionListItem> = new EventEmitter();
  _stepMention: MentionListItem & { step: WebhookTrigger };
  pathFormGroup: FormGroup<{ path: FormControl<string> }>;
  constructor(
    formBuilder: FormBuilder,
    private dialogService: MatDialog,
    private mentionsTreeCache: MentionsTreeCacheService,
    private store: Store
  ) {
    this.pathFormGroup = formBuilder.group({
      path: new FormControl<string>('${trigger.body}', {
        validators: Validators.pattern(pathRegex),
        nonNullable: true,
      }),
    });
  }
  ngOnInit(): void {
    this.sampleData = traverseStepOutputAndReturnMentionTree(
      this._stepMention.step.settings.inputUiInfo.currentSelectedData,
      this._stepMention.step.name,
      this._stepMention.step.displayName
    ).children;

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
  emitCustomPathMention() {
    if (this.pathFormGroup.valid) {
      const triggerPath = this.pathFormGroup.controls.path.value!;
      const triggerPathWithoutInterpolationDenotation = triggerPath.slice(
        2,
        triggerPath.length - 1
      );
      const mentionText = replaceArrayNotationsWithSpaces(
        replaceDotsWithSpaces(
          this.adjustItemPath(triggerPathWithoutInterpolationDenotation)
        )
      );
      const mentionItem: MentionListItem = {
        value: this.pathFormGroup.controls.path.value!,
        label: mentionText,
      };
      this.mentionEmitted.emit(mentionItem);
      this.dialogService.closeAll();
    }
  }
  adjustItemPath(triggerPathWithoutInterpolationDenotation: string): string {
    const triggerDisplayName = this._stepMention.step.displayName;
    return [
      triggerDisplayName,
      ...triggerPathWithoutInterpolationDenotation.split('.').slice(1),
    ].join('.');
  }
  openPathDialog(dialogTemplate: TemplateRef<unknown>) {
    this.dialogService.open(dialogTemplate);
  }
  selectStep() {
    this.store.dispatch(
      FlowsActions.selectStepByName({ stepName: this._stepMention.step.name })
    );
  }
}
