import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MentionListItem } from '../../utils';

@Component({
	selector: 'app-generic-mention-item',
	templateUrl: './generic-mention-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericMentionItemComponent {
	@Input() mention: MentionListItem;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	@Input() iconUrl: './assets/img/custom/configs.svg' | './assets/img/custom/connections.svg' =
		'./assets/img/custom/configs.svg';
}
