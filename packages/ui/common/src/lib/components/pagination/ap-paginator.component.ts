import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  DEFAULT_PAGE_SIZE,
  LIMIT_QUERY_PARAM,
  PAGE_SIZES,
} from '../../utils/tables.utils';

@Component({
  selector: 'ap-paginator',
  templateUrl: './ap-paginator.component.html',
})
export class ApPaginatorComponent implements OnInit, AfterViewInit {
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
          queryParams: { limit: val, cursor: undefined },
          queryParamsHandling: 'merge',
        });
      })
    );
  }
  ngAfterViewInit(): void {
    const pageSize = Number.parseInt(
      this.route.snapshot.queryParamMap.get(LIMIT_QUERY_PARAM) || '0'
    );

    this.pageSizeControl.setValue(pageSize || DEFAULT_PAGE_SIZE);
  }
  setQueryParams(cursor: string) {
    const params: { [key: string]: string | number } = {
      limit: this.pageSizeControl.value,
      cursor: cursor,
    };

    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
