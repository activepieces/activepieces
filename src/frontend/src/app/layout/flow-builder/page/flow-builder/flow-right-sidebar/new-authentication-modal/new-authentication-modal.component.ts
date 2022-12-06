import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, take } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { ConfigType } from 'src/app/layout/common-layout/model/enum/config-type';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { OAuth2ConfigSettings } from 'src/app/layout/common-layout/model/fields/variable/config-settings';
import { collectionActions } from 'src/app/layout/flow-builder/store/action/collection.action';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { environment } from 'src/environments/environment';
import { ConfigKeyValidator } from '../../validators/configKeyValidator';

@Component({
	selector: 'app-new-authentication-modal',
	templateUrl: './new-authentication-modal.component.html',
	styleUrls: ['./new-authentication-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class NewAuthenticationModalComponent implements OnInit, AfterViewInit {
	@ViewChild(NgSelectComponent) ngSelect!: NgSelectComponent;
	@Input() connectorAuthConfig: Partial<Config>;
	@Input() appName: string;
	@Input() configToUpdateWithIndex: { config: Config; indexInList: number } | undefined;
	@Output() saveClicked = new EventEmitter();
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
		this.collectionId$ = this.store.select(BuilderSelectors.selectCurrentCollectionId);
		this.settingsForm = this.fb.group({
			redirectUrl: new FormControl({ value: environment.redirectUrl, disabled: true }),
			clientSecret: new FormControl('', Validators.required),
			clientId: new FormControl('', Validators.required),
			authUrl: new FormControl('', Validators.required),
			refreshUrl: new FormControl(''),
			tokenUrl: new FormControl('', Validators.required),
			responseType: new FormControl('code', Validators.required),
			scope: new FormControl([], Validators.required),
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
		});
		if (!this.configToUpdateWithIndex) {
			this.settingsForm.patchValue(this.connectorAuthConfig.settings || {});
		} else {
			this.settingsForm.patchValue(this.configToUpdateWithIndex.config.settings!);
			this.settingsForm.get('key')?.setValue(this.configToUpdateWithIndex.config.key);
			this.settingsForm
				.get('scope')!
				.setValue((this.configToUpdateWithIndex.config.settings as OAuth2ConfigSettings).scope?.split(' '));
			this.settingsForm.get('key')!.disable();
		}
	}
	submit(currentCollectionId: UUID) {
		this.submitted = true;

		if (this.settingsForm.valid) {
			const config = this.constructConfig(currentCollectionId);
			this.saveConfigToCollection(config);
			this.saveClicked.next(config);
			this.bsModalRef.hide();
		}
	}
	constructConfig(currentCollectionId: UUID) {
		const scopes: string = (this.settingsForm.get('scope')!.value as string[]).map(str => str.trim()).join(' ');
		const configKey = this.configToUpdateWithIndex
			? this.configToUpdateWithIndex.config.key
			: this.settingsForm.get('key')!.value;
		const configLabel = this.configToUpdateWithIndex
			? this.configToUpdateWithIndex.config.label
			: this.settingsForm.get('key')!.value;
		const settingsFormValue = this.settingsForm.getRawValue();
		delete settingsFormValue.key;
		const configParent = this.connectorAuthConfig
			? { configKey: this.connectorAuthConfig.key }
			: (this.configToUpdateWithIndex?.config.settings as OAuth2ConfigSettings).configParent;
		const newConfig: Config = {
			key: configKey,
			label: configLabel,
			type: ConfigType.OAUTH2,
			collectionVersionId: currentCollectionId,
			settings: {
				...settingsFormValue,
				required: true,
				configParent: configParent,
				scope: scopes,
			},
			value: null,
		};
		return newConfig;
	}

	saveConfigToCollection(config: Config): void {
		if (!this.configToUpdateWithIndex) {
			this.store.dispatch(collectionActions.addConfig({ config: config }));
		} else {
			this.store.dispatch(
				collectionActions.updateConfig({ config: config, configIndex: this.configToUpdateWithIndex.indexInList })
			);
		}
	}

	ngAfterViewInit() {
		this.ngSelect.onInputBlur = () => {
			this.ngSelect.searchTerm = '';
		};
	}
}
