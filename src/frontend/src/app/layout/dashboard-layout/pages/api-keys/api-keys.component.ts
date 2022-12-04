import { Component, OnInit } from '@angular/core';
import { SeekPage } from '../../../common-layout/service/seek-page';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { ApiKey } from '../../../common-layout/model/api-key.interface';
import { faKey, faTrash } from '@fortawesome/free-solid-svg-icons';

import { ThemeService } from '../../../common-layout/service/theme.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmDeleteModalComponent } from '../../../common-layout/components/confirm-delete-modal/confirm-delete-modal.component';
import { NavigationService } from '../../service/navigation.service';
import { Observable, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApiKeysSelector } from '../../store/selectors/api-keys.selector';
import { ApiKeysActions } from '../../store/action/api-keys.action';
import { UUID } from 'angular2-uuid';

@Component({
	selector: 'app-api-keys',
	templateUrl: './api-keys.component.html',
	styleUrls: ['./api-keys.component.css'],
})
export class ApiKeysComponent implements OnInit {
	apiKeyPage$: Observable<SeekPage<ApiKey> | null>;
	loadedState$: Observable<boolean> = new Observable<boolean>();
	revealState: { [key: string]: boolean }[] = [];

	faKey = faKey;
	faTrash = faTrash;
	hoverIndex: number = -1;
	bsModalRef: BsModalRef;

	constructor(
		public themeService: ThemeService,
		public timeHelperService: TimeHelperService,
		private store: Store,
		private navigationService: NavigationService,
		private modalService: BsModalService
	) {}

	ngOnInit(): void {
		this.navigationService.setTitle('API Keys');
		this.store.dispatch(ApiKeysActions.loadApiKeys());
		this.loadedState$ = this.store.select(ApiKeysSelector.selectApiKeysLoaded);
		this.apiKeyPage$ = this.store.select(ApiKeysSelector.selectApiKeys);
	}

	secretText(apiKey: ApiKey) {
		let secret = apiKey.secret;
		if (!this.revealState[apiKey.id.toString()]) {
			secret = new Array(secret.length + 1).join('*');
		}
		return secret;
	}

	deleteApiKey(apikey: ApiKey, i: number) {
		this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent);
		this.bsModalRef.content.entityName = apikey.name;
		(this.bsModalRef.content as ConfirmDeleteModalComponent).confirmState.pipe(take(1)).subscribe(value => {
			if (value) {
				this.store.dispatch(ApiKeysActions.deleteApiKey({ id: apikey.id }));
			}
		});
	}

	toggleState(id: UUID) {
		this.revealState[id.toString()] = !this.revealState[id.toString()];
	}
}
