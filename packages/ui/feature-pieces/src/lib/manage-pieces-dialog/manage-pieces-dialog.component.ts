import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import {
  AuthenticationService,
  DropdownSearchControlComponent, ProjectService, SelectAllDirective, UiCommonModule,
} from '@activepieces/ui/common';
import { CommonModule } from '@angular/common';
import { PieceMetadataService } from '../services/piece.service';
import { PiecesFilterType } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

@Component({
  templateUrl: './manage-pieces-dialog.component.html',
  standalone: true,
  imports: [UiCommonModule, CommonModule, SelectAllDirective, DropdownSearchControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagePiecesDialogComponent {

  form: FormGroup<{
    pieces: FormControl<string[]>
  }>;

  managePieces$!: Observable<void>;
  pieces$: Observable<PieceMetadataModelSummary[]>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  allPieces: BehaviorSubject<string[] | undefined> = new BehaviorSubject<string[] | undefined>(undefined);
  searchControl: FormControl<string> = new FormControl<string>('', {
    nonNullable: true
  });
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { pieces: string[] },
    private dialogRef: MatDialogRef<ManagePiecesDialogComponent>,
    private pieceMetadataService: PieceMetadataService,
    private matSnackbar: MatSnackBar,
    private projectService: ProjectService,
    private authenticationService: AuthenticationService
  ) {
    this.form = new FormGroup({
      pieces: new FormControl<string[]>(data.pieces, {
        nonNullable: true,
        validators: []
      })
    });
    this.pieces$ = this.pieceMetadataService.listPieces({
      includeHidden: true
    }).pipe(tap(pieces => {
      this.allPieces.next(pieces.map(piece => piece.name));
    }))
  }

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading$.next(true);
    this.managePieces$ = this.projectService.update(this.authenticationService.getProjectId(), {
      plan: {
        pieces: this.form.value.pieces ?? [],
        piecesFilterType: PiecesFilterType.ALLOWED
      }
    }).pipe(
      tap(() => {
        this.matSnackbar.open($localize`Pieces List Updated`);
        this.loading$.next(false);
        this.dialogRef.close(true);
      }),
      map(() => void 0));

  }

}
