import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { StepResult } from 'src/app/layout/common-layout/model/instance-run.interface';

@Injectable({
	providedIn: 'root',
})
export class RunDetailsService {
	currentStepResult$: BehaviorSubject<{ stepName: string; result: StepResult | undefined } | undefined> =
		new BehaviorSubject<{ stepName: string; result: StepResult | undefined } | undefined>(undefined);
	iterationStepResultState$: Subject<{ stepName: string; result: StepResult | undefined }> = new Subject();
	hideAllIterationsInput$: Subject<boolean> = new Subject();
	constructor() {}
}
