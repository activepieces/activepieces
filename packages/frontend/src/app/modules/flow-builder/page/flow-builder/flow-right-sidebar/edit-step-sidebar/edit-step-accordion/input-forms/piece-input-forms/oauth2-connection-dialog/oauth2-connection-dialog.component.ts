import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { catchError, map, Observable, of, take, tap } from 'rxjs';
import { AppConnection, OAuth2AppConnection, OAuth2ConnectionValueWithApp, Project, UpsertOAuth2Request } from '@activepieces/shared';
import { fadeInUp400ms } from 'packages/frontend/src/app/modules/common/animation/fade-in-up.animation';
import { PieceConfig } from 'packages/frontend/src/app/modules/common/components/configs-form/connector-action-or-config';
import { AppConnectionsService } from 'packages/frontend/src/app/modules/common/service/app-connections.service';
import { CloudAuthConfigsService } from 'packages/frontend/src/app/modules/common/service/cloud-auth-configs.service';
import { ProjectService } from 'packages/frontend/src/app/modules/common/service/project.service';
import { ConnectionValidator } from 'packages/frontend/src/app/modules/flow-builder/page/flow-builder/validators/connectionNameValidator';
import { appConnectionsActions } from 'packages/frontend/src/app/modules/flow-builder/store/app-connections/app-connections.action';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';

interface AuthConfigSettings {
	appName: FormControl<string | null>;
	redirect_url: FormControl<string>;
	client_secret: FormControl<string>;
	client_id: FormControl<string>;
	auth_url: FormControl<string>;
	token_url: FormControl<string>;
	scope: FormControl<string>;
	name: FormControl<string>;
	value: FormControl<OAuth2ConnectionValueWithApp>;
	refresh_url: FormControl<string>;
	extraParams: FormControl<Record<string, unknown>>;
}
export const USE_CLOUD_CREDENTIALS = 'USE_CLOUD_CREDENTIALS';
@Component({
	selector: 'app-oauth2-connection-dialog',
	templateUrl: './oauth2-connection-dialog.component.html',
	styleUrls: ['./oauth2-connection-dialog.component.scss'],
	animations: [fadeInUp400ms],
})
export class OAuth2ConnectionDialogComponent implements OnInit {
	@Input() pieceAuthConfig: PieceConfig;
	@Input() pieceName: string;
	@Input() connectionToUpdate: OAuth2AppConnection | undefined;
	@Input() serverUrl: string;
	settingsForm: FormGroup<AuthConfigSettings>;
	loading = false;
	project$: Observable<Project>;
	submitted = false;
	clientIdTooltip = 'Your App ID, Key or Client ID. You can find it if you go to your app on the 3rd party service.';
	clientSecretTooltip =
		"Your App Secret. It's usually hidden and will show up when you click on Show in your app on the 3rd party service";
	redirectUrlTooltip =
		'Copy this URL and paste it under Redirect URL in your app on the 3rd party service. Activepieces predefines this because we manage the authentication flow.';
	scopesTooltip = 'The permissions needed to access the endpoints you plan to work with on the 3rd party service.';
	keyTooltip =
		'The ID of this authentication definition. You will need to select this key whenever you want to reuse this authentication.';
	hasCloudAuthCred$: Observable<boolean>;
	upsert$: Observable<AppConnection | null>;
	constructor(
		private fb: FormBuilder,
		private store: Store,
		public dialogRef: MatDialogRef<OAuth2ConnectionDialogComponent>,
		private cloudAuthConfigsService: CloudAuthConfigsService,
		private appConnectionsService: AppConnectionsService,
		private snackbar: MatSnackBar,
		@Inject(MAT_DIALOG_DATA)
		dialogData: {
			pieceAuthConfig: PieceConfig;
			pieceName: string;
			connectionToUpdate: OAuth2AppConnection | undefined;
			serverUrl: string;
		},
		private projectService: ProjectService
	) {
		this.pieceName = dialogData.pieceName;
		this.pieceAuthConfig = dialogData.pieceAuthConfig;
		this.connectionToUpdate = dialogData.connectionToUpdate;
		this.serverUrl = dialogData.serverUrl;
	}

	ngOnInit(): void {
		this.hasCloudAuthCred$ = this.cloudAuthConfigsService.getAppsAndTheirClientIds().pipe(
			map(res => {
				return !!res[this.pieceName];
			})
		);
		this.project$ = this.projectService.selectedProjectAndTakeOne();
		this.settingsForm = this.fb.group({
			extraParams: new FormControl<Record<string, unknown>>(this.pieceAuthConfig.extra ?? {}, {
				nonNullable: true,
				validators: [Validators.required],
			}),
			appName: new FormControl<string | null>(this.pieceName, { nonNullable: false, validators: [] }),
			redirect_url: new FormControl(this.serverUrl ? `${this.serverUrl}/redirect` : '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			client_secret: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			client_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			auth_url: new FormControl(this.pieceAuthConfig.authUrl || '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			token_url: new FormControl(this.pieceAuthConfig.tokenUrl || '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			scope: new FormControl(this.pieceAuthConfig.scope?.join(' ') || '', {
				nonNullable: true,
			}),
			name: new FormControl(this.pieceName.replace(/[^A-Za-z0-9_]/g, '_'), {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
				asyncValidators: [
					ConnectionValidator.createValidator(
						this.store.select(BuilderSelectors.selectAllAppConnections).pipe(take(1)),
						undefined
					),
				],
			}),
			value: new FormControl(undefined as any, Validators.required),
			refresh_url: new FormControl('code', { nonNullable: true, validators: [Validators.required] }),
		});
		this.settingsForm.controls.name.markAllAsTouched();
		if (this.connectionToUpdate) {
			this.settingsForm.controls.value.setValue(this.connectionToUpdate.value);
			this.settingsForm.controls.name.setValue(this.connectionToUpdate.name);
			this.settingsForm.controls.client_id.setValue(this.connectionToUpdate.value.client_id);
			this.settingsForm.controls.client_secret.setValue(this.connectionToUpdate.value.client_secret);
			this.settingsForm.controls.redirect_url.setValue(this.connectionToUpdate.value.redirect_url);
			this.settingsForm.controls.name.disable();
		}
	}
	submit(projectId: string) {
		this.settingsForm.markAllAsTouched();
		if (this.settingsForm.valid && !this.loading) {
			this.loading = true;
			const connection = this.constructConnection(projectId);
			this.saveConnection(connection);
		}
	}
	constructConnection(projectId: string) {
		const connectionName = this.connectionToUpdate
			? this.connectionToUpdate.name
			: this.settingsForm.controls.name.value;
		const settingsFormValue = { ...this.settingsForm.getRawValue() };
		const connectionValue = settingsFormValue.value;

		delete connectionValue['name'];
		delete connectionValue['appName'];
		const newConnection: UpsertOAuth2Request = {
			name: connectionName,
			appName: this.pieceName,
			value: {
				...connectionValue,
				client_id: this.settingsForm.controls.client_id.value,
				client_secret: this.settingsForm.controls.client_secret.value,
				redirect_url: this.settingsForm.controls.redirect_url.value,
				scope: this.settingsForm.controls.scope.value,
				token_url: this.settingsForm.controls.token_url.value,
			},
			projectId: projectId,
		};
		return newConnection;
	}

	saveConnection(connection: UpsertOAuth2Request): void {

		this.upsert$ = this.appConnectionsService.upsert(connection).pipe(
			catchError(err => {
				console.error(err);
				this.snackbar.open('Connection operation failed please check your console.', 'Close', { panelClass: 'error', duration: 5000 });
				return of(null);
			}),
			tap(connection => {
				if (connection) {
					this.store.dispatch(appConnectionsActions.upsert({ connection: connection }));
					this.dialogRef.close(connection);
				}
				this.loading = false;
			})
		);
	}
	get authenticationSettingsControlsValid() {

		return Object.keys(this.settingsForm.controls)
			.filter(k => k !== 'value' && !this.settingsForm.controls[k].disabled)
			.map(key => {
				return this.settingsForm.controls[key].valid;
			})
			.reduce((prev, next) => {
				return prev && next;
			}, true);
	}
	useCloudCreds() {
		this.dialogRef.close(USE_CLOUD_CREDENTIALS);
	}
}
