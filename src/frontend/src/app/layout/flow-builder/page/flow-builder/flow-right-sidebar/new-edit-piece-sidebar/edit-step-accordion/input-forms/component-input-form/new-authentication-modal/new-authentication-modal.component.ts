import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, take } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { FrontEndConnectorConfig } from 'src/app/layout/common-layout/components/configs-form/connector-action-or-config';
import { ConfigType } from 'src/app/layout/common-layout/model/enum/config-type';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { ConfigKeyValidator } from 'src/app/layout/flow-builder/page/flow-builder/validators/configKeyValidator';
import { CollectionActions } from 'src/app/layout/flow-builder/store/action/collection.action';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-new-authentication-modal',
	templateUrl: './new-authentication-modal.component.html',
	styleUrls: ['./new-authentication-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class NewAuthenticationModalComponent implements OnInit {
	@Input() connectorAuthConfig: FrontEndConnectorConfig;
	@Input() appName: string;
	@Input() configToUpdateWithIndex: { config: Config; indexInList: number } | undefined;
	settingsForm: FormGroup;
	saving = false;
	collectionId$: Observable<UUID>;
	submitted = false;
	clientIdTooltip = 'Your App ID, Key or Client ID. You can find it if you go to your app on the 3rd party service.';
	clientSecretTooltip =
		"Your App Secret. It's usually hidden and will show up when you click on Show in your app on the 3rd party service";
	redirectUrlTooltip =
		'Copy this URL and paste it under Redirect URL in your app on the 3rd party service. Activepieces predefines this because we manage the authentication flow.';
	scopesTooltip = 'The permissions needed to access the endpoints you plan to work with on the 3rd party service.';
	keyTooltip =
		'The ID of this authentication definition. You will need to select this key whenever you want to reuse this authentication.';
	constructor(private fb: FormBuilder, private store: Store, public bsModalRef: BsModalRef) {}

	ngOnInit(): void {
		debugger;
		this.collectionId$ = this.store.select(BuilderSelectors.selectCurrentCollectionId);
		console.log(environment.redirectUrl);
		this.settingsForm = this.fb.group({
			redirect_url: new FormControl(environment.redirectUrl),
			client_secret: new FormControl('', Validators.required),
			client_id: new FormControl('', Validators.required),
			auth_url: new FormControl(this.connectorAuthConfig.authUrl, Validators.required),
			token_url: new FormControl(this.connectorAuthConfig.tokenUrl, Validators.required),
			response_type: new FormControl('code', Validators.required),
			scope: [this.connectorAuthConfig.scopes, [Validators.required]],
			key: new FormControl(
				this.appName.replace(/[^A-Za-z0-9_]/g, '_'),
				[Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
				[
					ConfigKeyValidator.createValidator(
						this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
						undefined
					),
				]
			),
			value: new FormControl(null, Validators.required),
		});

		if (this.configToUpdateWithIndex) {
			this.settingsForm.patchValue({
				...this.configToUpdateWithIndex.config.settings!,
				value: this.configToUpdateWithIndex.config.value,
			});
			this.settingsForm.get('key')!.setValue(this.configToUpdateWithIndex.config.key);
			this.settingsForm.get('key')!.disable();
		}
	}
	submit(currentCollectionId: UUID) {
		this.submitted = true;

		if (this.settingsForm.valid) {
			const config = this.constructConfig(currentCollectionId);
			this.saveConfigToCollection(config);
			this.bsModalRef.onHidden.emit(config);
			this.bsModalRef.hide();
		}
	}
	constructConfig(currentCollectionId: UUID) {
		const configKey = this.configToUpdateWithIndex
			? this.configToUpdateWithIndex.config.key
			: this.settingsForm.get('key')!.value;
		const configLabel = this.configToUpdateWithIndex
			? this.configToUpdateWithIndex.config.label
			: this.settingsForm.get('key')!.value;
		const settingsFormValue = this.settingsForm.getRawValue();
		const value = settingsFormValue['value'];
		delete settingsFormValue['value'];
		delete settingsFormValue.key;
		const newConfig: Config = {
			key: configKey,
			label: configLabel,
			type: ConfigType.OAUTH2,
			collectionVersionId: currentCollectionId,
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
}
