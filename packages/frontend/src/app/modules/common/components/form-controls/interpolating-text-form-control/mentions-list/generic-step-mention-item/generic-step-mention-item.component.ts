import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { FlowItem } from '../../../../../model/flow-builder/flow-item';
import { MentionListItem } from '../../utils';

@Component({
  selector: 'app-generic-step-mention-item',
  templateUrl: './generic-step-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericStepMentionItemComponent {
  @Input() indentation = false;
  @Input() stepMention: MentionListItem & { step: FlowItem };
  @Input() stepIndex: number;
}
