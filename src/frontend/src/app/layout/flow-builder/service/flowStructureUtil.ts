import { FlowItem } from '../../common-layout/model/flow-builder/flow-item';
import { TriggerType } from '../../common-layout/model/enum/trigger-type.enum';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { Trigger } from '../../common-layout/model/flow-builder/trigger/trigger.interface';
import { LoopOnItemActionInterface } from '../../common-layout/model/flow-builder/actions/loop-action.interface';

export class FlowStructureUtil {
	constructor() {}

	static isAction(piece: FlowItem): boolean {
		const type = piece.type;
		if (type == undefined) {
			return false;
		}
		return Object.values(ActionType).includes(type as ActionType);
	}

	static isTrigger(piece: FlowItem): boolean {
		const type = piece.type;
		if (type == undefined) {
			return false;
		}
		return Object.values(TriggerType).includes(type as TriggerType);
	}

	public static findParent(
		mainPiece: FlowItem | Trigger | undefined,
		targetStepName: string
	): FlowItem | Trigger | undefined {
		if (mainPiece === undefined) {
			return undefined;
		}
		const branches = FlowStructureUtil.branches(mainPiece);
		for (let i = 0; i < branches.length; ++i) {
			const parent = this.findParent(branches[i], targetStepName);
			if (branches[i].name === targetStepName) {
				return mainPiece;
			}
			if (parent !== undefined) {
				return parent;
			}
		}
		return undefined;
	}

	public static traverseAllSteps(mainPiece: FlowItem | Trigger | undefined): FlowItem[] {
		if (mainPiece === undefined) {
			return [];
		}
		const steps: FlowItem[] = [mainPiece];
		const branches = FlowStructureUtil.branches(mainPiece);
		for (let i = 0; i < branches.length; ++i) {
			const subSteps = this.traverseAllSteps(branches[i]);
			for (let i = 0; i < subSteps.length; ++i) {
				steps.push(subSteps[i]);
			}
		}
		return steps;
	}

	public static findStep(
		mainPiece: FlowItem | Trigger | undefined,
		targetStepName: string
	): FlowItem | Trigger | undefined {
		if (mainPiece === undefined) {
			return undefined;
		}
		if (mainPiece.name === targetStepName) {
			return mainPiece;
		}
		const branches = FlowStructureUtil.branches(mainPiece);
		for (let i = 0; i < branches.length; ++i) {
			const action = this.findStep(branches[i], targetStepName);
			if (action !== undefined) {
				return action;
			}
		}
		return undefined;
	}

	public static branches(mainPiece: FlowItem | Trigger): FlowItem[] {
		const branches: FlowItem[] = [];
		if (mainPiece.type === ActionType.BRANCH) {
			const branchData = mainPiece;
			for (let i = 0; i < branchData.settings.branches.length; ++i) {
				const nextAction = branchData.settings.branches[i].nextAction;
				if (nextAction) {
					branches.push(nextAction);
				}
			}
		}
		if (mainPiece.type === ActionType.LOOP_ON_ITEMS) {
			const loopAction = mainPiece as LoopOnItemActionInterface;
			if (loopAction.firstLoopAction) {
				branches.push(loopAction.firstLoopAction);
			}
		}
		const nextAction = mainPiece.next_action;
		if (nextAction) {
			branches.push(nextAction);
		}
		return branches;
	}
}
