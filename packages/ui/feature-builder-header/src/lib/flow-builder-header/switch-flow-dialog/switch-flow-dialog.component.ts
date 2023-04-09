import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { Observable, map, startWith, switchMap } from 'rxjs';
import { Flow } from '@activepieces/shared';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './switch-flow-dialog.component.html',
  styleUrls: ['./switch-flow-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class SwitchFlowDialogComponent {
  searchForm: FormGroup<{ query: FormControl<string> }>;
  loading = false;
  flows$: Observable<Flow[]>;
  selectedIndex = 0;

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private router: Router,
    private dialogRef: MatDialogRef<SwitchFlowDialogComponent>
  ) {
    this.searchForm = this.formBuilder.group({
      query: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.flows$ = this.searchForm.valueChanges.pipe(
      startWith({ query: undefined }),
      switchMap((formValue) => {
        return this.store.select(BuilderSelectors.selectFlows).pipe(
          map((flows) => {
            return flows.filter((flow) =>
              !formValue.query || flow.version.displayName.toLowerCase().includes(formValue.query.toLowerCase())
            );
          })
        );
      })
    );
  }

  openFlow(flow: Flow) {
    this.router.navigate(['flows', flow.collectionId]);
    this.dialogRef.close();
  }

  onKeyDown(event: KeyboardEvent, flows: Flow[]): void {
    if (event.key === 'Enter') {
      this.openFlow(flows[this.selectedIndex]);
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(flows.length - 1, this.selectedIndex + 1);
    }
  }
}
