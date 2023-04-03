import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthenticationService } from '@activepieces/ui/common';

import { map, Observable, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent {
  @ViewChild('focusItem', { read: ElementRef })
  feedbackTextarea: ElementRef;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;
  feedbackControl = new FormControl<string>('', { nonNullable: true });
  sendFeedback$: Observable<void>;
  sendingFeedback = false;
  openFeedbackPopOver$: Observable<void>;
  constructor(
    public dialog: MatDialog,
    public authenticationService: AuthenticationService,
    private snackbarService: MatSnackBar
  ) {
    this.openFeedbackPopOver$ = this.authenticationService.openFeedbackPopover$
      .asObservable()
      .pipe(
        tap(() => {
          this.matMenuTrigger.openMenu();
        })
      );
  }
  sendFeedback() {
    if (this.feedbackControl.value) {
      this.sendingFeedback = true;
      this.sendFeedback$ = this.authenticationService
        .sendFeedback(this.feedbackControl.value)
        .pipe(
          map(() => void 0),
          tap(() => {
            this.matMenuTrigger.closeMenu();
            this.sendingFeedback = false;
            this.feedbackControl.setValue('');
            this.snackbarService.open('Feedback submitted');
          })
        );
    } else {
      this.matMenuTrigger.closeMenu();
    }
  }
  menuOpened() {
    this.feedbackTextarea.nativeElement.focus();
  }
}
