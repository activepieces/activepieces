import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { CollectionService } from 'src/app/modules/common/service/collection.service';

@Component({
	templateUrl: './delete-collection-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteCollectionDialogComponent {
	confirmationForm: FormGroup<{ confirmation: FormControl<string> }>;
	deleteCollection$: Observable<void>;
	constructor(
		private formBuilder: FormBuilder,
		private collectionService: CollectionService,
		private snackBar: MatSnackBar,
		@Inject(MAT_DIALOG_DATA) public collection: Collection,
		private dialogRef: MatDialogRef<DeleteCollectionDialogComponent>
	) {
		this.confirmationForm = this.formBuilder.group({
			confirmation: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('DELETE')],
			}),
		});
	}
	deleteCollection() {
		if (this.confirmationForm.valid && !this.deleteCollection$) {
			this.deleteCollection$ = this.collectionService.delete(this.collection.id).pipe(
				catchError(err => {
					this.snackBar.open('An error occurred while deleting, please check your console', '', {
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
					this.snackBar.open(`${this.collection.version.displayName} was deleted successfully`);
				})
			);
		}
	}
}
