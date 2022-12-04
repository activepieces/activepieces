import { Injectable } from '@angular/core';
import { FlowTemplateInterface } from '../model/flow-template.interface';
import { TriggerType } from '../../common-layout/model/enum/trigger-type.enum';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { CodeAction } from '../../common-layout/model/flow-builder/actions/code-action.interface';
import { Artifact } from '../model/artifact.interface';

@Injectable({
	providedIn: 'root',
})
export class FlowTemplateService {
	public FLOW_EMPTY_TEMPLATE: FlowTemplateInterface = {
		title: 'Start from scratch',
		description: 'Start building your collection form scratch.',
		icon: '/assets/img/custom/template/add-flow-rounded.svg',
		version: {
			access: 'PRIVATE',
			configs: [],
			trigger: {
				yOffsetFromLastNode: 0,
				name: 'trigger',
				displayName: 'Empty Trigger',
				type: TriggerType.EMPTY,
				settings: {},
			},
		},
	};

	public HELLO_WORLD: Artifact = {
		content: 'exports.codePiece = async (params) => {\n' + '    return true;\n' + '};\n',
		package: '{\n' + '  "dependencies": {\n' + '  }\n' + '}\n',
	};

	public FLOW_HELLO_WORLD_TEMPLATE: FlowTemplateInterface = {
		title: 'Hello World',
		description: 'Let this flow print hello world for you',
		icon: '/assets/img/custom/template/template-1.png',
		version: {
			access: 'PRIVATE',
			configs: [],
			trigger: {
				yOffsetFromLastNode: 0,
				name: 'trigger',
				displayName: 'Every 10 minutes',
				type: TriggerType.SCHEDULE,
				settings: {
					cronExpression: '0 */10 * ? * *',
				},
				nextAction: {
					name: 'step_1',
					displayName: 'Hello World',
					type: ActionType.CODE,
					settings: {
						input: {},
					},
				} as CodeAction,
			},
		},
	};

	public FLOW_TEMPLATE_INTERFACE: FlowTemplateInterface[] = [this.FLOW_EMPTY_TEMPLATE, this.FLOW_HELLO_WORLD_TEMPLATE];

	constructor() {}
}
