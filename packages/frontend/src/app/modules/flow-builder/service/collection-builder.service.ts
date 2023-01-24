import { Injectable } from '@angular/core';
import { FlowRendererService } from './flow-renderer.service';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../store/builder/builder.selector';
import { distinctUntilChanged } from 'rxjs';
import { FlowFactoryUtil } from './flowFactoryUtil';

@Injectable({
	providedIn: 'root',
})
export class CollectionBuilderService {
	lastSuccessfulSaveDate = '';

	constructor(private flowRendererService: FlowRendererService, private store: Store) {
		this.store
			.select(BuilderSelectors.selectCurrentFlow)
			.pipe(distinctUntilChanged())
			.subscribe(flow => {
				if (flow) {
					const rootStep = FlowFactoryUtil.createRootStep(flow!);
					this.flowRendererService.refreshCoordinatesAndSetActivePiece(rootStep);
				} else {
					this.flowRendererService.refreshCoordinatesAndSetActivePiece(undefined);
				}
			});
	}

	get unsavedNote() {
		return `Some changes are not saved due to disconnetion. Don't make new changes until your work is saved.
     ${this.lastSuccessfulSaveDate}`;
	}
}
