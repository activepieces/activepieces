import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FilterConfig } from '../../models/filter-config.interface';
import { UiCommonModule } from '../../ui-common.module';
import { CommonModule } from '@angular/common';
import { DropdownSearchControlComponent } from '../dropdown-search-control/dropdown-search-control.component';
import { Observable, of } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { SelectAllDirective } from '../../directives/select-all.directive';
import { ActivatedRoute } from '@angular/router';
import { TemplatePortal } from '@angular/cdk/portal';

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
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class ApFilterComponent implements OnInit {
  @ViewChild('filtersListButton', { static: true })
  filtersListButton: TemplateRef<unknown>;
  @Input() filters: FilterConfig<any, any>[];
  @Input() filterButtonType: 'icon' | 'button' = 'icon';
  availableFilters: {
    queryParam: string | string[];
    name: string;
  }[] = [];
  selectedFilters: string[] = [];
  isFilterSelected: Record<string, boolean> = {};
  filtersButtonPortal?: TemplatePortal;
  constructor(
    private activatedRoute: ActivatedRoute,
    private viewContainerRef: ViewContainerRef,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.filtersListButton) {
      this.filtersButtonPortal = new TemplatePortal(
        this.filtersListButton,
        this.viewContainerRef
      );
    } else {
      console.error('filters list button is not detected');
    }
    this.availableFilters = this.filters.map(({ queryParam, name }) => ({
      queryParam,
      name,
    }));
    this.filters = this.filters.map((filter) => ({
      ...filter,
      allValues:
        filter.allValues$ instanceof Observable
          ? filter.allValues$
          : of(filter.allValues$),
      options:
        filter.options$ instanceof Observable
          ? filter.options$
          : of(filter.options$ || []),
    }));
    this.selectedFilters = this.filters
      .map(({ queryParam, name }) => {
        if (typeof queryParam === 'string') {
          return this.activatedRoute.snapshot.queryParamMap.get(queryParam)
            ? name
            : null;
        } else {
          return queryParam.every((param) =>
            this.activatedRoute.snapshot.queryParamMap.get(param)
          )
            ? name
            : null;
        }
      })
      .filter((query): query is string => query !== null);
    this.selectedFilters.forEach((filter) => {
      this.isFilterSelected[filter] = true;
    });
  }

  onAddFilter(filter: string) {
    const isFilterSelected = this.selectedFilters.includes(filter);
    this.selectedFilters = isFilterSelected
      ? this.selectedFilters.filter((f) => f !== filter)
      : [...this.selectedFilters, filter];
    this.isFilterSelected[filter] = !isFilterSelected;

    const filterConfig = this.filters.find((f) => f.name === filter);
    if (filterConfig) {
      filterConfig.formControl?.setValue(
        isFilterSelected ? undefined : filterConfig.formControl?.value
      );
    }

    this.cd.markForCheck();
  }
}
