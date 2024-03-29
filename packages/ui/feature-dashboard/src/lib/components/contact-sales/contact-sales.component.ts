import { Component, EventEmitter, Output } from '@angular/core';
import {
  AuthenticationService,
  ContactSalesService,
} from '@activepieces/ui/common';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-contact-sales',
  templateUrl: './contact-sales.component.html',
  styleUrl: './contact-sales.component.scss',
})
export class ContactSalesComponent {
  sendRequest$: Observable<void> | undefined;
  isPending = false;

  @Output() cancel = new EventEmitter<void>();

  contactSalesState$: Observable<boolean>;

  constructor(
    public authenticationService: AuthenticationService,
    public contactSalesService: ContactSalesService,
    private snackbar: MatSnackBar
  ) {
    this.contactSalesState$ = this.contactSalesService.contactSalesState$;
  }

  closeSlideout() {
    this.contactSalesService.close();
  }

  submitForm() {
    if (!this.isPending) {
      this.isPending = true;
      this.sendRequest$ = this.contactSalesService.sendRequest().pipe(
        tap((response) => {
          this.isPending = false;
          if (!response.status || response.status === 'success') {
            this.snackbar.open(
              "We'll get in touch soon! Your request has been sent.",
              '',
              {
                duration: 3000,
              }
            );
          } else if (response.status === 'error') {
            const errorMessage =
              response.message ||
              'An error occurred while sending your request.';
            this.snackbar.open(errorMessage, '', {
              duration: 3000,
              panelClass: ['error'],
            });
          }
          this.closeSlideout();
        }),
        map(() => void 0),
        catchError(() => {
          this.isPending = false;
          this.snackbar.open(
            'Failed to send request due to a network or server error.',
            '',
            {
              duration: 3000,
              panelClass: ['error'],
            }
          );
          return of(void 0);
        })
      );
    }
  }
}
