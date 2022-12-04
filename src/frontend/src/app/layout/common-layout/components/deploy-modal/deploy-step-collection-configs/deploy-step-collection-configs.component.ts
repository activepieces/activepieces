import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { CollectionVersion } from '../../../model/piece.interface';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ConfigSource } from '../../../model/enum/config-source';

@Component({
	selector: 'app-deploy-step-global-config',
	templateUrl: './deploy-step-collection-configs.component.html',
	styleUrls: ['./deploy-step-collection-configs.component.css'],
})
export class DeployStepGlobalConfigComponent implements OnInit {
	@Output() cancelClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() nextClicked: EventEmitter<any> = new EventEmitter<any>();
	@Input() accountId: UUID;
	@Input() collectionVersion: CollectionVersion;
	collectionConfigsForm: FormGroup;
	submitted = false;
	@Input() loading = false;

	constructor(private formBuilder: FormBuilder) {
		this.collectionConfigsForm = this.formBuilder.group({
			collectionConfigs: new FormControl(),
		});
	}
	ngOnInit(): void {
		this.collectionVersion = JSON.parse(JSON.stringify(this.collectionVersion));
		this.collectionVersion.configs = this.collectionVersion.configs.filter(c => c.source !== ConfigSource.PREDEFINED);
		this.collectionVersion.configs = this.collectionVersion.configs.map(c => {
			return {
				...c,
				collectionVersionId: this.collectionVersion.id,
			};
		});
	}

	nextStep() {
		this.submitted = true;
		if (this.collectionConfigsForm.invalid) return;
		this.loading = true;
		this.nextClicked.emit(this.collectionConfigsForm.get('collectionConfigs')!.value);
	}
}
