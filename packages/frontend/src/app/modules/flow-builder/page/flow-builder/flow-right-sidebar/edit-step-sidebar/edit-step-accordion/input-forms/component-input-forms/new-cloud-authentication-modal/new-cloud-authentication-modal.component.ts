import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { CloudOAuth2Config, Config, ConfigType } from 'shared';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { PieceConfig } from 'src/app/modules/common/components/configs-form/connector-action-or-config';
import { CloudConnectionPopupSettings } from 'src/app/modules/common/components/form-controls/o-auth2-cloud-connect-control/o-auth2-cloud-connect-control.component';
import { ConfigKeyValidator } from 'src/app/modules/flow-builder/page/flow-builder/validators/configKeyValidator';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/builder/builder.selector';
import { CollectionActions } from 'src/app/modules/flow-builder/store/collection/collection.action';

interface AuthConfigSettings {
	pieceName: FormControl<string | null>;
	key: FormControl<string>;
	value: FormControl<any>;
}
export const USE_MY_OWN_CREDENTIALS = 'USE_MY_OWN_CREDENTIALS';
@Component({
	selector: 'app-new-cloud-authentication-modal',
	templateUrl: './new-cloud-authentication-modal.component.html',
	styleUrls: ['./new-cloud-authentication-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class NewCloudAuthenticationModalComponent implements OnInit {
	@Input() pieceAuthConfig: PieceConfig;
	@Input() pieceName: string;
	@Input() configToUpdateWithIndex: { config: CloudOAuth2Config; indexInList: number } | undefined;
	cloudConnectionPopupSettings: CloudConnectionPopupSettings;
	settingsForm: FormGroup<AuthConfigSettings>;
	collectionId$: Observable<string>;
	submitted = false;
	keyTooltip =
		'The ID of this authentication definition. You will need to select this key whenever you want to reuse this authentication.';
	constructor(
		private fb: FormBuilder,
		private store: Store,
		public dialogRef: MatDialogRef<NewCloudAuthenticationModalComponent>,
		@Inject(MAT_DIALOG_DATA)
		dialogData: {
			pieceAuthConfig: PieceConfig;
			pieceName: string;
			configToUpdateWithIndex: { config: CloudOAuth2Config; indexInList: number } | undefined;
			clientId: string;
		}
	) {
		this.pieceName = dialogData.pieceName;
		this.pieceAuthConfig = dialogData.pieceAuthConfig;
		this.configToUpdateWithIndex = dialogData.configToUpdateWithIndex;

		this.cloudConnectionPopupSettings = {
			authUrl: this.pieceAuthConfig.authUrl!,
			scope: this.pieceAuthConfig.scope!.join(' '),
			extraParams: this.pieceAuthConfig.extra!,
			pieceName: this.pieceName,
			clientId: dialogData.clientId,
		};
	}

	ngOnInit(): void {
		this.collectionId$ = this.store.select(BuilderSelectors.selectCurrentCollectionId);
		this.settingsForm = this.fb.group({
			pieceName: new FormControl<string | null>(this.pieceName, { nonNullable: false, validators: [] }),
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
		});
		if (this.configToUpdateWithIndex) {
			this.settingsForm.controls.value.setValue(this.configToUpdateWithIndex.config.value);
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
			type: ConfigType.CLOUD_OAUTH2,
			settings: {
				pieceName: this.cloudConnectionPopupSettings.pieceName,
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
	useOwnCred() {
		this.dialogRef.close(USE_MY_OWN_CREDENTIALS);
	}
}
