import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { CollectionService } from 'src/app/modules/common/service/collection.service';

@Component({
	templateUrl: './archive-collection-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveCollectionDialogComponent {
	confirmationForm: FormGroup<{ confirmation: FormControl<string> }>;
	archiveCollection$: Observable<void>;
	constructor(
		private formBuilder: FormBuilder,
		private collectionService: CollectionService,
		private snackBar: MatSnackBar,
		@Inject(MAT_DIALOG_DATA) public collection: Collection,
		private dialogRef: MatDialogRef<ArchiveCollectionDialogComponent>
	) {
		this.confirmationForm = this.formBuilder.group({
			confirmation: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('ARCHIVE')],
			}),
		});
	}
	archiveCollection() {
		if (this.confirmationForm.valid && !this.archiveCollection$) {
			this.archiveCollection$ = this.collectionService.archive(this.collection.id).pipe(
				catchError(err => {
					this.snackBar.open('An error occured while archiving, please check your console', '', {
						duration: undefined,
						panelClass: 'error',
					});
					console.error(err);
					return of(err);
				}),
				map(() => {
					return void 0;
				}),
				tap(() => {
					this.dialogRef.close(true);
					this.snackBar.open(`${this.collection.last_version.display_name} was archived successfully`);
				})
			);
		}
	}
}
