import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FlowService, fadeInUp400ms } from '@activepieces/ui/common';
import { Observable, map, shareReplay, startWith, switchMap } from 'rxjs';
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
  allOptions$: Observable<SearchItem[]>;
  selectedIndex = 0;

  constructor(
    private formBuilder: FormBuilder,
    private flowService: FlowService,
    private router: Router,
    private dialogRef: MatDialogRef<SwitchFlowDialogComponent>
  ) {
    this.searchForm = this.formBuilder.group({
      query: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.allOptions$ = this.flowService.list({ limit: 100, cursor: undefined }).pipe(
      map((flowPage) => {
        const items = [
          {
            label: 'View Runs',
            value: 'runs',
            icon: '/assets/img/custom/dashboard/runs.svg',
            type: 'RUNS',
          },
          {
            label: 'View All Flows',
            value: 'flows',
            icon: '/assets/img/custom/all-flows.svg',
            type: 'DASHBOARD',
          },
        ];
        for (let i = 0; i < flowPage.data.length; ++i) {
          const flow = flowPage.data[i];
          items.push({
            label: flow.version.displayName,
            value: flow.id,
            icon: '/assets/img/custom/dashboard/collections.svg',
            type: 'FLOWS',
          });
        }
        return items;
      }),
      shareReplay(1)
    );
    this.options$ = this.searchForm.valueChanges.pipe(
      startWith({ query: undefined }),
      switchMap((formValue) => {
        return this.allOptions$.pipe(map((options) => {
          const queryString = formValue?.query;
          this.selectedIndex = 0;
          if (queryString) {
            return options.filter((option) => {
              return option.label.toLowerCase().includes(queryString.toLowerCase());
            });
          }
          return options;
        }));
      })
    );
  }

  selectFlow(index: number) {
    this.selectedIndex = index;
  }

  doAction(type: string, value: string) {
    switch (type) {
      case 'FLOWS':
        this.router.navigate(['flows', value]);
        break;
      case 'RUNS':
        this.router.navigate(['runs']);
        break;
      case 'DASHBOARD':
        this.router.navigate(['flows']);
        break;
    }
    this.dialogRef.close();
  }

  onKeyDown(event: KeyboardEvent, options: SearchItem[]): void {
    console.log("Pressed " + event.key);
    if (event.key === 'Enter') {
      this.doAction(
        options[this.selectedIndex].type,
        options[this.selectedIndex].value
      );
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(options.length - 1, this.selectedIndex + 1);
    } else if (event.key === 'Tab') {
      if (event.shiftKey) {
        this.selectedIndex--;
        if (this.selectedIndex < 0) {
          this.selectedIndex = options.length - 1;
        }
      } else {
        this.selectedIndex++;
        if (this.selectedIndex >= options.length) {
          this.selectedIndex = 0;
        }
      }
      event.preventDefault();
    }
  }
}
