import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LeftSideBarType } from 'src/app/layout/common-layout/model/enum/left-side-bar-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { distinctUntilChanged, map, Observable, skipWhile, take, tap } from 'rxjs';
import { updateSettings } from '../../../../store/action/piece.action';
import { fadeInUp400ms } from '../../../../../common-layout/animation/fade-in-up.animation';
import { FlowsActions } from '../../../../store/action/flows.action';
import { Collection } from '../../../../../common-layout/model/piece.interface';

@Component({
	selector: 'app-piece-settings',
	templateUrl: './piece-settings.component.html',
	styleUrls: ['./piece-settings.component.scss'],
	animations: [fadeInUp400ms],
})
export class PieceSettingsComponent implements OnInit {
	title = 'Settings';
	pieceSettingsForm: FormGroup;
	saveLoading = false;
	logoUrl: string;
	logoFile: File;
	formBuilder: FormBuilder = new FormBuilder();

	autoSaveChanges$: Observable<void>;
	updateCollectionInformation$: Observable<Collection>;

	constructor(private store: Store) {}

	ngOnInit(): void {
		this.pieceSettingsForm = this.formBuilder.group({
			icon: new FormControl(),
			description: new FormControl('', [Validators.required]),
		});

		this.updateCollectionInformation$ = this.store.select(BuilderSelectors.selectCurrentCollection).pipe(
			take(1),
			tap(piece => {
				if (piece) {
					this.pieceSettingsForm.controls['description'].setValue(piece?.lastVersion.description);
				}
				if (piece && piece.lastVersion.logoUrl) {
					this.logoUrl = piece?.lastVersion.logoUrl;
					fetch(this.logoUrl, { mode: 'no-cors' }).then(r => {
						r.blob().then(blob => {
							this.logoFile = new File([blob], 'icon.png');
						});
					});
				}
				this.pieceSettingsForm.get('description')?.setValue(piece.lastVersion.description);

				this.setupAutoSave();
			})
		);
	}

	setupAutoSave() {
		const initialValue = this.pieceSettingsForm.value;
		this.autoSaveChanges$ = this.pieceSettingsForm.valueChanges.pipe(
			skipWhile(f => JSON.stringify(f) === JSON.stringify(initialValue)),
			distinctUntilChanged((a, b) => {
				return JSON.stringify(a) === JSON.stringify(b);
			}),
			tap(value => {
				this.autoSave(value);
			}),
			map(value => void 0)
		);
	}

	closeSidebar() {
		this.store.dispatch(
			FlowsActions.setLeftSidebar({
				sidebarType: LeftSideBarType.NONE,
				props: {},
			})
		);
	}

	autoSave(value: any) {
		const icon = value.icon;
		const description = value.description;
		if (icon != undefined) {
			const reader = new FileReader();
			reader.onload = () => {
				this.store.dispatch(
					updateSettings({
						logoEncodedUrl: reader.result as string,
						logoFile: icon,
						description: description ?? '',
					})
				);
			};
			reader.readAsDataURL(icon);
		} else {
			this.store.dispatch(
				updateSettings({
					logoEncodedUrl: undefined,
					logoFile: undefined,
					description: description ?? '',
				})
			);
		}
	}
}
