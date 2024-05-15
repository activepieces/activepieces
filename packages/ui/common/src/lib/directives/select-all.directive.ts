import {
  AfterViewInit,
  Directive,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { Subscription } from 'rxjs';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'mat-option[selectAll]',
  standalone: true,
})
export class SelectAllDirective implements AfterViewInit, OnDestroy {
  @Input({ required: true }) allValues: any[] = [];

  private _matSelect = inject(MatSelect);
  private _matOption = inject(MatOption);

  private _subscriptions: Subscription[] = [];

  ngAfterViewInit(): void {
    const parentSelect = this._matSelect;
    const parentFormControl = parentSelect.ngControl.control;

    // For changing other option selection based on select all
    this._subscriptions.push(
      this._matOption.onSelectionChange.subscribe((ev) => {
        if (ev.isUserInput) {
          if (ev.source.selected) {
            parentFormControl?.setValue(this.allValues);
            this._matOption.select(false);
          } else {
            parentFormControl?.setValue([]);
            this._matOption.deselect(false);
          }
        }
      })
    );

    setTimeout(() => {
      if (parentFormControl?.value?.length === this.allValues.length) {
        this._matOption.select(false);
      }
    });
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((s) => s.unsubscribe());
  }
}
