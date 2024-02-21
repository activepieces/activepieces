import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { MentionListItem } from '@activepieces/ui/common';
@Component({
  selector: 'app-generic-mention-item',
  templateUrl: './generic-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericMentionItemComponent {
  @Input() mention: MentionListItem;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  @Input() leftPadding = '0px';
}
