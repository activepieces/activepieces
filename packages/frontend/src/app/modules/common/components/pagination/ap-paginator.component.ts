import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from './tables.utils';

@Component({
  selector: 'app-ap-paginator',
  templateUrl: './ap-paginator.component.html',
})
export class ApPaginatorComponent implements OnInit {
  @Input() pageSizes: number[] = PAGE_SIZES;
  @Output() pageChanged: EventEmitter<string> = new EventEmitter();
  @Output() pageSizeChanged: EventEmitter<number> = new EventEmitter();
  pageSizeChanged$!: Observable<number>;
  pageSizeControl!: FormControl<number>;
  constructor(private router: Router, private route: ActivatedRoute) {}
  previous: string | null = null;
  next: string | null = null;
  ngOnInit(): void {
    this.pageSizeControl = new FormControl(DEFAULT_PAGE_SIZE, {
      nonNullable: true,
    });
    this.pageSizeChanged$ = this.pageSizeControl.valueChanges.pipe(
      tap((val) => {
        this.pageSizeChanged.emit(val);
        this.router.navigate(['.'], {
          relativeTo: this.route,
          queryParams: { limit: val },
          queryParamsHandling: 'merge',
        });
      })
    );

    if (
      !this.route.snapshot.queryParamMap.get('limit') &&
      !this.route.snapshot.queryParamMap.get('cursor')
    ) {
      this.setQueryParams('');
    } else {
      const pageSize = Number.parseInt(
        this.route.snapshot.queryParamMap.get('limit')!
      );
      if (!pageSize) {
        this.router.navigate(['.'], {
          relativeTo: this.route,
          queryParams: { pageSize: DEFAULT_PAGE_SIZE },
          queryParamsHandling: 'merge',
        });
      } else {
        this.pageSizeControl.setValue(pageSize);
      }
    }
  }

  setQueryParams(cursor: string) {
    const params: { [key: string]: string | number } = {
      limit: this.pageSizeControl.value,
    };
    if (cursor) {
      params['cursor'] = cursor;
    }
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
