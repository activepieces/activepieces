import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { EventDefinition } from '../../../common-layout/model/event.-definition.interface';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { NavigationService } from '../../service/navigation.service';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { CommonSelectors } from '../../../common-layout/store/selector/common.selector';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CreateNewEventModalComponent } from '../../../common-layout/components/create-new-event-modal/create-new-event-modal.component';

@Component({
	selector: 'app-events',
	templateUrl: './events.component.html',
	styleUrls: ['./events.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsComponent implements OnInit {
	events$: Observable<EventDefinition[]>;
	bsModalRef: BsModalRef;

	constructor(
		private modalService: BsModalService,
		public timeHelperService: TimeHelperService,
		private navigationService: NavigationService,
		private store: Store
	) {}

	ngOnInit(): void {
		this.navigationService.setTitle('Events');
		this.events$ = this.store.select(CommonSelectors.selectEvents);
	}

	openCreateEvent() {
		this.bsModalRef = this.modalService.show(CreateNewEventModalComponent);
	}
}
