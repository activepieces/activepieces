import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '../../ui-common.module';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'ap-dropdown-search-control',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field
      subscriptSizing="dynamic"
      appearance="fill"
      (click)="$event.stopPropagation()"
      class="ap-w-full "
    >
      <mat-icon matPrefix color="placeholder-icon" svgIcon="search"></mat-icon>
      <input
        #searchInput
        [formControl]="searchControl"
        matInput
        [placeholder]="'Search'"
        autocomplete="off"
        (keydown.Space)="$event.stopPropagation()"
      />
    </mat-form-field>
  `,
})
export class DropdownSearchControlComponent {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @Input({ required: true }) searchControl: FormControl<string>;

  focus() {
    this.searchInput?.nativeElement.focus();
  }
}
