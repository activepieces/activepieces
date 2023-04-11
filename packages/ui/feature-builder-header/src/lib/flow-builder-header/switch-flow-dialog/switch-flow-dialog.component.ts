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
import { Observable, startWith, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

type SearchItem = {
  label: string;
  value: string;
  type: string;
  icon: string;
};

@Component({
  templateUrl: './switch-flow-dialog.component.html',
  styleUrls: ['./switch-flow-dialog.component.scss'],
  animations: [fadeInUp400ms],
})
export class SwitchFlowDialogComponent {
  searchForm: FormGroup<{ query: FormControl<string> }>;
  loading = false;
  options$: Observable<SearchItem[]>;
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
    this.options$ = this.searchForm.valueChanges.pipe(
      startWith({ query: undefined }),
      switchMap((formValue) => {
        return this.store.select(
          BuilderSelectors.selectSearchItems(formValue.query ?? '')
        );
      })
    );
  }

  selectFlow(index: number) {
    this.selectedIndex = index;
  }

  openFlow(flowId: string) {
    this.router.navigate(['flows', flowId]);
    this.dialogRef.close();
  }

  onKeyDown(event: KeyboardEvent, options: SearchItem[]): void {
    if (event.key === 'Enter') {
      this.openFlow(options[this.selectedIndex].value);
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(options.length - 1, this.selectedIndex + 1);
    }
  }
}
