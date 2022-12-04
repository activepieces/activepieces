import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { tableColumnNameAndProperty } from 'src/app/layout/common-layout/components/table/columnNameAndProperty';
import { AuthenticationType } from 'src/app/layout/common-layout/helper/authentication-type.enum';
import { ProjectAuthentication } from 'src/app/layout/common-layout/model/authentication';
import { ProjectEnvironment } from 'src/app/layout/common-layout/model/project-environment.interface';
import { TimeHelperService } from 'src/app/layout/common-layout/service/time-helper.service';
import { NavigationService } from '../../service/navigation.service';
import { fetchAuthenticationsSuccessful } from '../../store/action/authentication.action';
import {
	selectFirebaseAuthentications,
	selectSigningKeyAuthentications,
} from '../../store/selectors/authentication.selector';
import { FirebaseProjectIdModalComponent } from './firebase-project-id-modal/firebase-project-id-modal.component';
import { SigningKeyModalComponent } from './signing-key-modal/signing-key-modal.component';
import { EnvironmentSelectors } from '../../../common-layout/store/selector/environment.selector';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';

@Component({
	selector: 'app-authentication',
	templateUrl: './authentication.component.html',
	styleUrls: ['./authentication.component.scss'],
	animations: [fadeInUp400ms],
})
export class AuthenticationComponent implements OnInit, OnDestroy {
	destroyed$: Subject<boolean> = new Subject<boolean>();
	bsModalRef: BsModalRef<FirebaseProjectIdModalComponent | SigningKeyModalComponent>;
	selectedAuthenticationType = AuthenticationType.SIGNING_KEY;
	authentications$: Observable<
		{
			environmentName: string;
			dateGenerated: string;
			projectId: string;
			environmentId: string;
		}[]
	>;
	environments$: Observable<ProjectEnvironment[]> = of([]);
	firebaseTableColumns: tableColumnNameAndProperty[] = [
		{ columnName: 'Environment', propertyName: 'environmentName' },
		{
			columnName: 'Firebase Project ID',
			propertyName: 'projectId',
			emptyValueText: 'Not set',
		},
	];
	signingKeyTableColumns: tableColumnNameAndProperty[] = [
		{ columnName: 'Environment', propertyName: 'environmentName' },
		{
			columnName: 'Key',
			propertyName: 'dateGenerated',
			emptyValueText: 'No key was generated',
		},
	];
	constructor(
		private modalService: BsModalService,
		private navigationService: NavigationService,
		private route: ActivatedRoute,
		private store: Store,
		private timeHelper: TimeHelperService
	) {}

	ngOnDestroy(): void {
		this.destroyed$.next(true);
		this.destroyed$.complete();
	}

	ngOnInit(): void {
		this.navigationService.setTitle('Authentication');

		this.environments$ = this.store.select(EnvironmentSelectors.selectEnvironments);
		const authentications = this.route.snapshot.data['authentications'] as ProjectAuthentication[];
		this.store.dispatch(fetchAuthenticationsSuccessful({ authentications: authentications }));
		this.signingKeyAuthenticationsSelected();
	}

	get AuthenticationType() {
		return AuthenticationType;
	}

	openFireabseProjectIdModal(environmentId: string, environmentName: string, projectId: string) {
		this.bsModalRef = this.modalService.show(FirebaseProjectIdModalComponent, {
			class: 'modal-dialog-centered',
			initialState: {
				environmentId: environmentId,
				environmentName: environmentName,
				currentProjectId: projectId,
			},
		});
	}
	openGenerateKeyModal(environmentId: string, environmentName: string) {
		this.bsModalRef = this.modalService.show(SigningKeyModalComponent, {
			class: 'modal-dialog-centered',
			keyboard: false,
			backdrop: 'static',
			initialState: {
				environmentId: environmentId,
				environmentName: environmentName,
			},
		});
	}

	setAuthenticationType(type: AuthenticationType) {
		this.selectedAuthenticationType = type;
		if (this.selectedAuthenticationType === AuthenticationType.FIREBASE) {
			this.firebaseAuthenticationsSelected();
		} else {
			this.signingKeyAuthenticationsSelected();
		}
	}

	firebaseAuthenticationsSelected() {
		this.authentications$ = this.store
			.select(selectFirebaseAuthentications)
			.pipe(takeUntil(this.destroyed$))
			.pipe(switchMap(this.prepareTableData.bind(this)));
	}

	signingKeyAuthenticationsSelected() {
		this.authentications$ = this.store
			.select(selectSigningKeyAuthentications)
			.pipe(takeUntil(this.destroyed$))
			.pipe(switchMap(this.prepareTableData.bind(this)));
	}

	prepareTableData(authentications: ProjectAuthentication[]): Observable<any> {
		return this.environments$.pipe(
			map(environments => {
				return environments.map(e => {
					const tableValue = {
						environmentName: e.name,
						dateGenerated: '',
						projectId: '',
						environmentId: e.id,
					};
					const envAuthentication = authentications.find(a => a.environmentId === e.id);
					if (envAuthentication) {
						if (envAuthentication.type === AuthenticationType.FIREBASE && envAuthentication.firebaseProjectId) {
							tableValue.projectId = envAuthentication.firebaseProjectId;
						} else if (envAuthentication.type === AuthenticationType.SIGNING_KEY) {
							tableValue.dateGenerated = `Last key was generated on ${this.timeHelper.formatDateToString(
								new Date(envAuthentication.epochCreationTime * 1000)
							)}`;
						}
					}

					return tableValue;
				});
			})
		);
	}
}
