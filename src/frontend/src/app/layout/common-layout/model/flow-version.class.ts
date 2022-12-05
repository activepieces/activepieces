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
	display_name: string;
	description: string;
	state: VersionEditState;
	configs: Config[];
	created: number;
	epochCreationTimeFormatted?: string;
	updated: number;
	trigger?: Trigger;
	versionNumber?: number;
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
		valid: boolean;
	}) {
		this.id = obj.id;
		this.valid = obj.valid;
		this.flowId = obj.flowId;
		this.display_name = obj.displayName;
		this.description = obj.description;
		this.state = obj.state;
		this.configs = obj.configs;
		this.created = obj.epochCreationTime;
		this.updated = obj.epochUpdateTime;
		this.trigger = obj.trigger;
	}

	public static clone(flow: FlowVersion): FlowVersion {
		return new FlowVersion(JSON.parse(JSON.stringify(flow)));
	}

	public updateStep(targetStepName: string, updatedValue: FlowItem | Trigger): FlowVersion {
		const step = FlowStructureUtil.findStep(this.trigger, targetStepName);
		if (step !== undefined) {
			step.display_name = updatedValue.display_name;
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
			parentDraggedPiece.next_action = draggedPiece.next_action;
			draggedPiece.next_action = newParentPiece.next_action;
			newParentPiece.next_action = draggedPiece as FlowItem;
		}
	}

	public replaceTrigger(trigger: Trigger): FlowVersion {
		this.trigger!.type = trigger.type;
		this.trigger!.display_name = trigger.display_name;
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
				cloneNewStep.next_action = loop.firstLoopAction;
				loop.firstLoopAction = cloneNewStep;
			} else {
				cloneNewStep.next_action = step?.next_action;
				step.next_action = cloneNewStep;
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
					loopItem.firstLoopAction = step?.next_action;
				}
			}
			if (
				parent.next_action !== undefined &&
				parent.next_action !== null &&
				parent.next_action.name === targetStepName
			) {
				parent.next_action = step?.next_action;
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
