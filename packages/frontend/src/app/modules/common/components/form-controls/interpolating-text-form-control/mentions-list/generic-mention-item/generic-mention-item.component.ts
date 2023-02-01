import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { fadeIn400ms } from '../../../../../animation/fade-in.animations';
import { MentionListItem } from '../../utils';

@Component({
	selector: 'app-generic-mention-item',
	templateUrl: './generic-mention-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [fadeIn400ms]
})
export class GenericMentionItemComponent {
	@Input() mention: MentionListItem;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	@Input() leftPadding = "0px"
}
