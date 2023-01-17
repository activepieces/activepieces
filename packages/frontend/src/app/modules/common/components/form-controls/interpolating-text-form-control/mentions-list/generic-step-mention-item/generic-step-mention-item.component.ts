import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FlowItem } from 'src/app/modules/common/model/flow-builder/flow-item';
import { FlowItemDetails } from 'src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { MentionListItem } from '../../utils';

@Component({
	selector: 'app-generic-step-mention-item',
	templateUrl: './generic-step-mention-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericStepMentionItemComponent implements OnInit {
	@Input() stepMention: MentionListItem & { step: FlowItem };
	flowItemDetails$: Observable<FlowItemDetails | undefined>;
	constructor(private store: Store) {}
	ngOnInit(): void {
		this.flowItemDetails$ = this.store.select(BuilderSelectors.selectFlowItemDetails(this.stepMention.step));
	}
}
