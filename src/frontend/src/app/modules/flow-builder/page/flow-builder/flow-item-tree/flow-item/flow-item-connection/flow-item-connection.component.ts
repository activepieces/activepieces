import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ThemeService } from '../../../../../../common/service/theme.service';
import { FlowItem } from '../../../../../../common/model/flow-builder/flow-item';
import { ActionType } from 'src/app/modules/common/model/enum/action-type.enum';
import { LoopOnItemActionInterface } from '../../../../../../common/model/flow-builder/actions/loop-action.interface';

@Component({
	selector: 'app-flow-item-connection',
	templateUrl: './flow-item-connection.component.html',
	styleUrls: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemConnectionComponent {
	@Input() flowItem: FlowItem;
	@Input() colorLine = false;
	@Input() viewMode: boolean;
	@Input() insideLoop = false;
	constructor(public themeService: ThemeService) {}

	get ActionType() {
		return ActionType;
	}

	castToLoopItem() {
		return this.flowItem as LoopOnItemActionInterface;
	}
}
