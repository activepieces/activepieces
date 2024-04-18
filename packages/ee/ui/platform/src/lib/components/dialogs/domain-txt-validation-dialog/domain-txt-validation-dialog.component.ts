import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, BehaviorSubject, catchError, tap } from 'rxjs';
import {
  CustomDomainService,
  HostnameDetailsResponse,
} from '../../../service/custom-domain.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-domain-txt-validation-dialog',
  templateUrl: './domain-txt-validation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DomainTxtValidationDialogComponent implements AfterViewInit {
  readonly title = $localize`Verify Custom Domain`;
  loading$ = new BehaviorSubject(false);

  readonly cloudHostname = 'cloud.activepieces.com';
  markdownInstructions$: BehaviorSubject<string> = new BehaviorSubject('');

  verificationStatus$?: Observable<{ status: string }>;
  constructor(
    private customDomainService: CustomDomainService,
    private matsnackbar: MatSnackBar,
    private dialogRef: MatDialogRef<DomainTxtValidationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      domainId: string;
      cloudflareHostnameData: HostnameDetailsResponse;
    }
  ) {}
  ngAfterViewInit(): void {
    this.markdownInstructions$.next(`
    Please add the following **TWO** DNS Records:
    <br />
    <br />
    **CNAME Record Key**:
    \`\`\`text
    ${this.data.cloudflareHostnameData.hostname} 
    \`\`\`
    **CNAME Record Value**:
    \`\`\`text
    ${this.cloudHostname}
    \`\`\`
    
    **TXT Record Key**:
    \`\`\`text
    ${this.data.cloudflareHostnameData.txtName}
    \`\`\`
    
    **TXT Record Value**:
    \`\`\`text
    ${this.data.cloudflareHostnameData.txtValue}
    \`\`\`
    `);
  }

  verifyDomain() {
    if (!this.loading$.value) {
      this.loading$.next(true);
      this.verificationStatus$ = this.customDomainService
        .verifyDomain(this.data.domainId)
        .pipe(
          tap(({ status }) => {
            this.loading$.next(false);
            if (status !== 'pending') {
              this.matsnackbar.open($localize`Verification Succeeded`, '', {});
              this.dialogRef.close(true);
            } else {
              this.matsnackbar.open(
                $localize`Verification Failed, it may take a few minutes to verify`,
                '',
                {}
              );
            }
          }),
          catchError((err) => {
            this.loading$.next(false);
            this.matsnackbar.open('Failed to verify domain. Try again', '', {
              panelClass: 'error',
            });
            throw err;
          })
        );
    }
  }
}
