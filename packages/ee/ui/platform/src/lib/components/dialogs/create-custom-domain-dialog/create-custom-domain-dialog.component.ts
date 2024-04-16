import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import {
  BehaviorSubject,
  Observable,
  catchError,
  tap,
  map,
  filter,
} from 'rxjs';
import { CustomDomainService } from '../../../service/custom-domain.service';
import { CustomDomain } from '@activepieces/ee-shared';
import { FlagService } from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
import { DomainTxtValidationDialogComponent } from '../domain-txt-validation-dialog/domain-txt-validation-dialog.component';

@Component({
  selector: 'app-create-custom-domain-dialog',
  templateUrl: './create-custom-domain-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCustomDomainDialogComponent {
  readonly ApEdition = ApEdition;
  readonly title = $localize`Add Custom Domain`;
  readonly cloudNote = $localize`Please contact support for DNS configuration and domain verification.`;
  loading$ = new BehaviorSubject(false);
  addCustomDomain$?: Observable<{
    customDomain: CustomDomain;
    cloudflareHostnameData: null | {
      txtName: string;
      txtValue: string;
    };
  }>;
  formGroup: FormGroup<{
    domain: FormControl<string>;
  }>;
  edition$: Observable<string>;
  constructor(
    private fb: FormBuilder,
    private customDomainService: CustomDomainService,
    private dialogRef: MatDialogRef<CreateCustomDomainDialogComponent>,
    private dialog: MatDialog,
    private flagService: FlagService
  ) {
    this.edition$ = this.flagService.getEdition();
    this.formGroup = this.fb.group({
      domain: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      const rawData = this.formGroup.getRawValue();
      this.addCustomDomain$ = this.customDomainService
        .create({
          domain: rawData.domain,
        })
        .pipe(
          tap(({ customDomain, cloudflareHostnameData }) => {
            this.loading$.next(false);
            this.dialogRef.close(true);
            this.edition$.pipe(
              map((edition) => edition === ApEdition.CLOUD),
              filter((isCloud) => isCloud),
              tap(() => {
                this.dialog.open(DomainTxtValidationDialogComponent, {
                  data: {
                    cloudflareHostnameData,
                    domainId: customDomain.id,
                  },
                });
              })
            );
          }),
          catchError((err) => {
            this.loading$.next(false);
            console.error(err);
            throw err;
          })
        );
    }
  }
}
