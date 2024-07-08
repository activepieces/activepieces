import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FilterConfig } from '../../models/filter-config.interface';
import { UiCommonModule } from '../../ui-common.module';
import { CommonModule } from '@angular/common';
import { DropdownSearchControlComponent } from '../dropdown-search-control/dropdown-search-control.component';
import { Observable, of } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { SelectAllDirective } from '../../directives/select-all.directive';

@Component({
  selector: 'ap-filter',
  templateUrl: './ap-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiCommonModule,
    CommonModule,
    DropdownSearchControlComponent,
    SelectAllDirective,
    MatSelect,
  ],
})
export class ApFilterComponent implements OnInit {
  @Input() filters: FilterConfig<any, any>[];
  @Input() selectedFilters: string[];
  @Output() selectedFiltersChange = new EventEmitter<string[]>();

  availableFilters: string[] = [];

  ngOnInit() {
    this.availableFilters = this.filters.map((filter) => filter.name);
    this.filters = this.filters.map((filter) => ({
      ...filter,
      allValues:
        filter.allValues instanceof Observable
          ? filter.allValues
          : of(filter.allValues),
      options:
        filter.options instanceof Observable
          ? filter.options
          : of(filter.options || []),
    }));
  }

  onAddFilter(filter: string) {
    let newSelectedFilters: string[];
    if (this.selectedFilters.includes(filter)) {
      newSelectedFilters = this.selectedFilters.filter((f) => filter !== f);
    } else {
      newSelectedFilters = [...this.selectedFilters, filter];
    }
    this.selectedFiltersChange.emit(newSelectedFilters);
  }
}
