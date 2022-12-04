import { VersionEditState } from './enum/version-edit-state.enum';
import { UUID } from 'angular2-uuid';
import { Trigger } from './flow-builder/trigger/trigger.interface';
import { ActionType } from './enum/action-type.enum';
import { CodeAction } from './flow-builder/actions/code-action.interface';
import { AddButtonType } from './enum/add-button-type';
import { LoopOnItemActionInterface } from './flow-builder/actions/loop-action.interface';
import { FlowStructureUtil } from '../../flow-builder/service/flowStructureUtil';
import { Config } from './fields/variable/config';
import { FlowItem } from './flow-builder/flow-item';

export class FlowVersion {
	id: UUID;
	flowId: UUID;
	displayName: string;
	description: string;
	state: VersionEditState;
	configs: Config[];
	epochCreationTime: number;
	epochCreationTimeFormatted?: string;
	epochUpdateTime: number;
	trigger?: Trigger;
	versionNumber?: number;
	access: any;
	valid: boolean;

	constructor(obj: {
		id: UUID;
		flowId: UUID;
		displayName: string;
		description: string;
		state: VersionEditState;
		configs: Config[];
		epochCreationTime: number;
		epochUpdateTime: number;
		trigger: Trigger;
		access: any;
		valid: boolean;
	}) {
		this.id = obj.id;
		this.valid = obj.valid;
		this.flowId = obj.flowId;
		this.displayName = obj.displayName;
		this.description = obj.description;
		this.state = obj.state;
		this.configs = obj.configs;
		this.epochCreationTime = obj.epochCreationTime;
		this.epochUpdateTime = obj.epochUpdateTime;
		this.trigger = obj.trigger;
		this.access = obj.access;
	}

	public static clone(flow: FlowVersion): FlowVersion {
		return new FlowVersion(JSON.parse(JSON.stringify(flow)));
	}

	public updateStep(targetStepName: string, updatedValue: FlowItem | Trigger): FlowVersion {
		const step = FlowStructureUtil.findStep(this.trigger, targetStepName);
		if (step !== undefined) {
			step.displayName = updatedValue.displayName;
			step.type = updatedValue.type;
			step.name = updatedValue.name;
			step.valid = updatedValue.valid;
			step.settings = updatedValue.settings;
		}
		this.valid = this.isValid();
		return this;
	}

	public isValid(): boolean {
		return FlowStructureUtil.traverseAllSteps(this.trigger).findIndex(f => f.valid == false) == -1;
	}

	public dropPiece(draggedPieceName: string, newParentName: string) {
		const draggedPiece = FlowStructureUtil.findStep(this.trigger, draggedPieceName);
		const parentDraggedPiece = FlowStructureUtil.findParent(this.trigger, draggedPieceName);
		const newParentPiece = FlowStructureUtil.findStep(this.trigger, newParentName);
		if (draggedPiece && newParentPiece && parentDraggedPiece) {
			parentDraggedPiece.nextAction = draggedPiece.nextAction;
			draggedPiece.nextAction = newParentPiece.nextAction;
			newParentPiece.nextAction = draggedPiece as FlowItem;
		}
	}

	public replaceTrigger(trigger: Trigger): FlowVersion {
		this.trigger!.type = trigger.type;
		this.trigger!.displayName = trigger.displayName;
		this.trigger!.name = trigger.name;
		this.trigger!.settings = trigger.settings;
		this.trigger!.valid = trigger.valid;
		this.valid = this.isValid();
		return this;
	}

	public addNewChild(
		targetStepName: string,
		newStep: FlowItem,
		buttonType: AddButtonType = AddButtonType.NEXT_ACTION
	): FlowVersion {
		const step = FlowStructureUtil.findStep(this.trigger, targetStepName);
		const cloneNewStep: FlowItem = JSON.parse(JSON.stringify(newStep));
		if (step) {
			if (step.type === ActionType.LOOP_ON_ITEMS && buttonType === AddButtonType.FIRST_LOOP_ACTION) {
				const loop: LoopOnItemActionInterface = step as LoopOnItemActionInterface;
				cloneNewStep.nextAction = loop.firstLoopAction;
				loop.firstLoopAction = cloneNewStep;
			} else {
				cloneNewStep.nextAction = step?.nextAction;
				step.nextAction = cloneNewStep;
			}
		}
		this.valid = this.isValid();
		return this;
	}

	public deleteStep(targetStepName: string) {
		const step = FlowStructureUtil.findStep(this.trigger, targetStepName);
		const parent = FlowStructureUtil.findParent(this.trigger, targetStepName);
		if (step && parent) {
			if (parent.type === ActionType.LOOP_ON_ITEMS) {
				const loopItem = parent as LoopOnItemActionInterface;
				if (
					loopItem.firstLoopAction !== undefined &&
					loopItem.firstLoopAction !== null &&
					loopItem.firstLoopAction.name === targetStepName
				) {
					loopItem.firstLoopAction = step?.nextAction;
				}
			}
			if (parent.nextAction !== undefined && parent.nextAction !== null && parent.nextAction.name === targetStepName) {
				parent.nextAction = step?.nextAction;
			}
		}
		this.valid = this.isValid();
		return this;
	}

	public findAvailableName(stepPrefix: string) {
		const steps = FlowStructureUtil.traverseAllSteps(this.trigger);
		let number = 1;
		while (true) {
			let exist = false;
			for (let i = 0; i < steps.length; ++i) {
				const action = steps[i];
				if (action.name === stepPrefix.toString().toLowerCase() + '_' + number) {
					exist = true;
					break;
				}
			}
			if (exist) {
				number++;
			} else {
				break;
			}
		}
		return stepPrefix.toString().toLowerCase() + '_' + number;
	}

	public codeActions(): CodeAction[] {
		return FlowStructureUtil.traverseAllSteps(this.trigger)
			.filter(f => f.type === ActionType.CODE)
			.map(f => f as CodeAction);
	}
}
