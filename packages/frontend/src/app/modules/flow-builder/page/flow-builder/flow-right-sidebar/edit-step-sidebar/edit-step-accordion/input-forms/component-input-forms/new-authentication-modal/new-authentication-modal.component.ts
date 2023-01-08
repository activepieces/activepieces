import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { Config, ConfigType, OAuth2Config } from 'shared';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { PieceConfig } from 'src/app/modules/common/components/configs-form/connector-action-or-config';
import { ConfigKeyValidator } from 'src/app/modules/flow-builder/page/flow-builder/validators/configKeyValidator';
import { CollectionActions } from 'src/app/modules/flow-builder/store/action/collection.action';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';

interface AuthConfigSettings {
	pieceName: FormControl<string | null>;
	redirectUrl: FormControl<string>;
	clientSecret: FormControl<string>;
	clientId: FormControl<string>;
	authUrl: FormControl<string>;
	tokenUrl: FormControl<string>;
	scope: FormControl<string>;
	key: FormControl<string>;
	value: FormControl<any>;
	refreshUrl: FormControl<string>;
	extraParams: FormControl<Record<string, unknown>>;
}
@Component({
	selector: 'app-new-authentication-modal',
	templateUrl: './new-authentication-modal.component.html',
	styleUrls: ['./new-authentication-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class NewAuthenticationModalComponent implements OnInit {
	@Input() pieceAuthConfig: PieceConfig;
	@Input() pieceName: string;
	@Input() configToUpdateWithIndex: { config: OAuth2Config; indexInList: number } | undefined;
	@Input() serverUrl: string;
	settingsForm: FormGroup<AuthConfigSettings>;
	collectionId$: Observable<string>;
	submitted = false;
	clientIdTooltip = 'Your App ID, Key or Client ID. You can find it if you go to your app on the 3rd party service.';
	clientSecretTooltip =
		"Your App Secret. It's usually hidden and will show up when you click on Show in your app on the 3rd party service";
	redirectUrlTooltip =
		'Copy this URL and paste it under Redirect URL in your app on the 3rd party service. Activepieces predefines this because we manage the authentication flow.';
	scopesTooltip = 'The permissions needed to access the endpoints you plan to work with on the 3rd party service.';
	keyTooltip =
		'The ID of this authentication definition. You will need to select this key whenever you want to reuse this authentication.';
	constructor(
		private fb: FormBuilder,
		private store: Store,
		public dialogRef: MatDialogRef<NewAuthenticationModalComponent>,
		@Inject(MAT_DIALOG_DATA)
		dialogData: {
			pieceAuthConfig: PieceConfig;
			pieceName: string;
			configToUpdateWithIndex: { config: OAuth2Config; indexInList: number } | undefined;
			serverUrl: string;
		}
	) {
		this.pieceName = dialogData.pieceName;
		this.pieceAuthConfig = dialogData.pieceAuthConfig;
		this.configToUpdateWithIndex = dialogData.configToUpdateWithIndex;
		this.serverUrl = dialogData.serverUrl;
	}

	ngOnInit(): void {
		this.collectionId$ = this.store.select(BuilderSelectors.selectCurrentCollectionId);
		this.settingsForm = this.fb.group({
			extraParams: new FormControl<Record<string, unknown>>(this.pieceAuthConfig.extra ?? {}, {
				nonNullable: true,
				validators: [Validators.required],
			}),
			pieceName: new FormControl<string | null>(this.pieceName, { nonNullable: false, validators: [] }),
			redirectUrl: new FormControl(this.serverUrl ? `${this.serverUrl}/redirect` : '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			clientSecret: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			authUrl: new FormControl(this.pieceAuthConfig.authUrl || '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			tokenUrl: new FormControl(this.pieceAuthConfig.tokenUrl || '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			scope: new FormControl(this.pieceAuthConfig.scope?.join(' ') || '', {
				nonNullable: true,
				validators: [Validators.required],
			}),
			key: new FormControl(this.pieceName.replace(/[^A-Za-z0-9_]/g, '_'), {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
				asyncValidators: [
					ConfigKeyValidator.createValidator(
						this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
						undefined
					),
				],
			}),
			value: new FormControl(undefined as any, Validators.required),
			refreshUrl: new FormControl('code', { nonNullable: true, validators: [Validators.required] }),
		});

		if (this.configToUpdateWithIndex) {
			this.settingsForm.patchValue({
				...this.configToUpdateWithIndex.config.settings,
				value: this.configToUpdateWithIndex.config.value,
			});
			this.settingsForm.controls.key.setValue(this.configToUpdateWithIndex.config.key);
			this.settingsForm.controls.key.disable();
		}
	}
	submit() {
		this.submitted = true;
		this.settingsForm.markAllAsTouched();
		if (this.settingsForm.valid) {
			const config = this.constructConfig();
			this.saveConfigToCollection(config);
			this.dialogRef.close(config);
		}
	}
	constructConfig() {
		const configKey = this.configToUpdateWithIndex
			? this.configToUpdateWithIndex.config.key
			: this.settingsForm.get('key')!.value;
		const settingsFormValue: any = { ...this.settingsForm.getRawValue() };
		const value = settingsFormValue['value'];
		delete settingsFormValue['value'];
		delete settingsFormValue.key;
		const newConfig: Config = {
			key: configKey,
			type: ConfigType.OAUTH2,
			settings: {
				...settingsFormValue,
				required: true,
			},
			value: value,
		};
		return newConfig;
	}

	saveConfigToCollection(config: Config): void {
		if (!this.configToUpdateWithIndex) {
			this.store.dispatch(CollectionActions.addConfig({ config: config }));
		} else {
			this.store.dispatch(
				CollectionActions.updateConfig({ config: config, configIndex: this.configToUpdateWithIndex.indexInList })
			);
		}
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
}
