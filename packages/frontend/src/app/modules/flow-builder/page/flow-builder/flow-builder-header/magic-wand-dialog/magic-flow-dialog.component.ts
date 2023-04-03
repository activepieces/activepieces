import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Flow } from '@activepieces/shared';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { FlowService } from '../../../../../common/service/flow.service';

@Component({
  templateUrl: './magic-flow-dialog.component.html',
  animations: [fadeInUp400ms],
})
export class MagicWandDialogComponent {
  promptForm: FormGroup<{ prompt: FormControl<string> }>;
  guessAi$: Observable<Flow | undefined>;
  loading = false;
  failed = false;
  constructor(
    private formBuilder: FormBuilder,
    private flowService: FlowService,
    private dialogRef: MatDialogRef<MagicWandDialogComponent>
  ) {
    this.promptForm = this.formBuilder.group({
      prompt: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }
  guessAi() {
    this.loading = true;
    this.failed = false;
    this.guessAi$ = this.flowService
      .guessFlow(this.promptForm.value.prompt!)
      .pipe(
        tap(() => {
          this.loading = false;
          this.dialogRef.close();
        }),
        catchError((error) => {
          this.loading = false;
          this.failed = true;
          return of(void 0);
        }),
        map(() => void 0)
      );
  }
}
