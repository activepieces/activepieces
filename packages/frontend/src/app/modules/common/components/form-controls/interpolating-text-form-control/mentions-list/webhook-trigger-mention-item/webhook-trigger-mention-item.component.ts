import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
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
import { FlowItem } from 'packages/frontend/src/app/modules/common/model/flow-builder/flow-item';
import {
  MentionListItem,
  replaceArrayNotationsWithSpaces,
  replaceDotsWithSpaces,
} from '../../utils';

const pathRegex = /\$\{trigger((\.[a-zA-Z_$][a-zA-Z_$0-9]*)(\[([0-9])+\])*)*\}/;
@Component({
  selector: 'app-webhook-trigger-mention-item',
  templateUrl: './webhook-trigger-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebhookTriggerMentionItemComponent {
  @Input()
  set stepMention(val: MentionListItem & { step: FlowItem }) {
    if (val.step.type !== TriggerType.WEBHOOK) {
      throw new Error('Step is not a webhook trigger');
    }
    this._stepMention = val as MentionListItem & { step: WebhookTrigger };
  }
  @Input() stepIndex: number;
  @Output() pathChosen: EventEmitter<MentionListItem> = new EventEmitter();
  _stepMention: MentionListItem & { step: WebhookTrigger };
  pathFormGroup: FormGroup<{ path: FormControl<string> }>;
  constructor(formBuilder: FormBuilder, private dialogService: MatDialog) {
    this.pathFormGroup = formBuilder.group({
      path: new FormControl<string>('${trigger.property}', {
        validators: Validators.pattern(pathRegex),
        nonNullable: true,
      }),
    });
  }
  emitMention() {
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
      this.pathChosen.emit(mentionItem);
      this.dialogService.closeAll();
    }
  }
  adjustItemPath(triggerPathWithoutInterpolationDenotation: string): any {
    const triggerDisplayName = this._stepMention.step.displayName;
    return [
      triggerDisplayName,
      ...triggerPathWithoutInterpolationDenotation.split('.').slice(1),
    ].join('.');
  }
  openPathDialog(dialogTemplate: TemplateRef<any>) {
    this.dialogService.open(dialogTemplate);
  }
}
