import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MentionListItem } from '../../utils';
import { FlowItem } from '@activepieces/ui/feature-builder-store';

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
