import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, BehaviorSubject, Subject, catchError, tap } from 'rxjs';
import { CustomDomainService } from '../../../service/custom-domain.service';

@Component({
  selector: 'app-domain-txt-validation-dialog',
  templateUrl: './domain-txt-validation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainTxtValidationDialogComponent {
  readonly title = $localize`Verify Custom Domain`;
  loading$ = new BehaviorSubject(false);
  error$ = '';
  refresh$: Subject<boolean> = new Subject();
  verificationStatus$?: Observable<{ status: string }>;
  constructor(
    private customDomainService: CustomDomainService,
    private dialogRef: MatDialogRef<DomainTxtValidationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      domainId: string;
      cloudflareHostnameData: {
        txtName: string;
        txtValue: string;
      };
    }
  ) {}

  verifyDomain() {
    if (!this.loading$.value) {
      this.verificationStatus$ = this.customDomainService
        .verifyDomain(this.data.domainId)
        .pipe(
          tap(({ status }) => {
            this.loading$.next(false);
            if (status !== 'pending') {
              this.dialogRef.close(true);
              this.refresh$.next(true);
            } else {
              this.error$ = 'Failed to verify domain. Try again';
            }
          }),
          catchError((err) => {
            this.loading$.next(false);
            this.error$ = 'Failed to verify domain. Try again';
            throw err;
          })
        );
    }
  }
}
