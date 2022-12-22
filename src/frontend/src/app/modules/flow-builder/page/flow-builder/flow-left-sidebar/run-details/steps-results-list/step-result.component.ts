import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';

import { Store } from '@ngrx/store';

import { map, Observable, startWith, tap } from 'rxjs';
import { ActionStatus } from 'src/app/modules/common/model/enum/action-status';
import { LoopStepOutput, StepResult } from 'src/app/modules/common/model/instance-run.interface';
import { RunDetailsService } from '../iteration-details.service';
import { FlowsActions } from '../../../../../store/action/flows.action';
import { fadeInAnimation } from 'src/app/modules/common/animation/fade-in.animations';

@Component({
	selector: 'app-step-result',
	templateUrl: './step-result.component.html',
	styleUrls: ['./step-result.component.scss'],
	animations: [fadeInAnimation(400, false)],
})
export class StepResultComponent implements OnInit, AfterViewInit {
	@Input() stepNameAndResult: { stepName: string; result: StepResult };
	@Input() set selectedStepName(stepName: string | null) {
		this._selectedStepName = stepName;
		if (this._selectedStepName === this.stepNameAndResult.stepName) {
			this.runDetailsService.hideAllIterationsInput$.next(true);
			this.childStepSelected.emit();
		}
	}
	@Input() nestingLevel = 0;
	@Input() isTrigger = false;
	@Output() childStepSelected = new EventEmitter();
	isLoopStep = false;
	nestingLevelPadding: string = '0px';
	finishedBuilding = false;
	iterationIndexControl = new FormControl(1);
	iteration$: Observable<{ stepName: string; result: StepResult }[]>;
	iterationsAccordionList: { stepName: string; result: StepResult }[][] = [];
	hideIterationInput$: Observable<boolean>;
	showIterationInput = false;
	iterationInputMinWidth = '0px';
	_selectedStepName: string | null = '';
	constructor(private store: Store, private runDetailsService: RunDetailsService) {
		this.hideIterationInput$ = this.runDetailsService.hideAllIterationsInput$.pipe(
			tap(() => {
				this.showIterationInput = false;
			})
		);
	}

	ngOnInit(): void {
		this.nestingLevelPadding = `${this.nestingLevel * 25}px`;
		if (this.stepNameAndResult.result.output.iterations) {
			this.isLoopStep = true;
			const loopOutput = this.stepNameAndResult.result as LoopStepOutput;
			loopOutput.output.iterations.forEach(iteration => {
				this.iterationsAccordionList.push(this.createStepResultsForDetailsAccordion(iteration));
			});
			this.iteration$ = this.iterationIndexControl.valueChanges.pipe(
				startWith(1),
				tap((newIndex: number | null) => {
					if (newIndex) {
						this.iterationInputMinWidth = `${newIndex.toString().length}ch`;
					} else {
						this.iterationInputMinWidth = '0ch';
					}
				}),
				map((newIndex: number | null) => {
					if (newIndex === null) {
						return 1;
					}
					if (newIndex < 1) {
						this.iterationIndexControl.setValue(1);
						return 1;
					} else if (newIndex > this.stepNameAndResult.result.output.iterations!.length) {
						this.iterationIndexControl.setValue(this.stepNameAndResult.result.output.iterations!.length);
						return this.stepNameAndResult.result.output.iterations!.length;
					}
					return newIndex;
				}),
				map((newIndex: number) => {
					if (!newIndex) {
						return this.iterationsAccordionList[0] || [];
					}
					const iteration = this.iterationsAccordionList[newIndex - 1];
					return iteration || [];
				}),
				tap(iteration => {
					iteration.forEach(st => {
						const stepNameAndResult = { stepName: st.stepName, result: st.result };
						this.runDetailsService.iterationStepResultState$.next(stepNameAndResult);
						if (st.stepName === this.runDetailsService.currentStepResult$.value?.stepName) {
							this.runDetailsService.currentStepResult$.next(stepNameAndResult);
						}
					});

					const firstIteration = this.iterationsAccordionList[0];
					const stepsThatWereNotReached = firstIteration.slice(iteration.length);
					stepsThatWereNotReached.forEach(st => {
						this.clearStepsThatWereNotReached(st);
					});
				})
			);
		}

		if (this._selectedStepName === this.stepNameAndResult.stepName) {
			this.childStepSelected.emit();
			this.runDetailsService.currentStepResult$.next(this.stepNameAndResult);
		}
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			this.finishedBuilding = true;
		}, 1);
	}

	get ActionStatus() {
		return ActionStatus;
	}

	selectStepOrToggleExpansionPanel($event: MouseEvent, expansionPanel: MatExpansionPanel) {
		if (this._selectedStepName !== this.stepNameAndResult.stepName) {
			this.store.dispatch(
				FlowsActions.selectStepByName({
					stepName: this.stepNameAndResult.stepName,
				})
			);
			this.runDetailsService.hideAllIterationsInput$.next(true);
			this.childStepSelected.emit();
			this.runDetailsService.currentStepResult$.next(this.stepNameAndResult);
		} else if (expansionPanel) {
			expansionPanel.toggle();
		}

		$event.stopPropagation();
	}

	createStepResultsForDetailsAccordion(iteration: { [key: string]: StepResult }): {
		result: StepResult;
		stepName: string;
	}[] {
		const iterationStepsNames = Object.keys(iteration);
		return iterationStepsNames.map(stepName => {
			return {
				stepName: stepName,
				result: iteration[stepName],
			};
		});
	}

	indexSearchClicked($event: MouseEvent) {
		$event.stopPropagation();
	}

	clearStepsThatWereNotReached(parentLoopStepResultAndName: { stepName: string; result: StepResult }) {
		this.runDetailsService.iterationStepResultState$.next({
			stepName: parentLoopStepResultAndName.stepName,
			result: undefined,
		});
		if (parentLoopStepResultAndName.stepName === this.runDetailsService.currentStepResult$.value?.stepName) {
			this.runDetailsService.currentStepResult$.next(undefined);
		}
		if (parentLoopStepResultAndName.result.output.iterations) {
			const firstIterationResult = this.createStepResultsForDetailsAccordion(
				parentLoopStepResultAndName.result.output.iterations[0]
			);
			firstIterationResult.forEach(st => {
				this.clearStepsThatWereNotReached(st);
			});
		}
	}
	childStepSelectedHandler() {
		this.showIterationInput = true;
		this.childStepSelected.emit();
	}
	doneClicked($event: MouseEvent, iterationInput: HTMLElement) {
		$event.stopPropagation();
		iterationInput.blur();
	}
}
