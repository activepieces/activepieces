import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MentionListItem } from '../../utils';

@Component({
	selector: 'app-mention-list-item-template',
	templateUrl: './mention-list-item-template.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionListItemTemplateComponent {
	@Input() itemLabel: string;
	@Input() itemIconUrl: string;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
}
