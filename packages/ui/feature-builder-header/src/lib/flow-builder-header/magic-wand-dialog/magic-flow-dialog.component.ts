import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Flow } from '@activepieces/shared';
import {
  FlowService,
  fadeInUp400ms,
  findDefaultFlowDisplayName,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

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
    private dialogRef: MatDialogRef<MagicWandDialogComponent>,
    private store: Store
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
    this.guessAi$ = forkJoin({
      flows: this.store.select(BuilderSelectors.selectFlows).pipe(take(1)),
      collectionId: this.store
        .select(BuilderSelectors.selectCurrentCollectionId)
        .pipe(take(1)),
    }).pipe(
      map((res) => {
        return {
          collectionId: res.collectionId,
          flowName: findDefaultFlowDisplayName(res.flows),
        };
      }),
      switchMap((res) => {
        return this.flowService
          .guessFlow(
            this.promptForm.value.prompt!,
            res.flowName,
            res.collectionId
          )
          .pipe(
            tap((res) => {
              if (res) {
                this.store.dispatch(FlowsActions.addFlow({ flow: res }));
              }
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
      })
    );
  }
}
