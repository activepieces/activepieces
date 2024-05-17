import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  CURSOR_QUERY_PARAM,
  DEFAULT_PAGE_SIZE,
  LIMIT_QUERY_PARAM,
  NEXT_QUERY_PARAM,
  PAGE_SIZES,
  PREVIOUS_QUERY_PARAM,
} from '../../utils/tables.utils';
import { NavigationService } from '../../service';

@Component({
  selector: 'ap-paginator',
  templateUrl: './ap-paginator.component.html',
})
export class ApPaginatorComponent implements OnInit {
  @Input() pageSizes: number[] = PAGE_SIZES;
  @Output() pageChanged: EventEmitter<string> = new EventEmitter();
  @Output() pageSizeChanged: EventEmitter<number> = new EventEmitter();
  cursor?: string;
  pageSizeChanged$!: Observable<number>;
  pageSizeControl!: FormControl<number>;
  constructor(
    private navigationService: NavigationService,
    private route: ActivatedRoute
  ) {}
  previous: string | null = null;
  next: string | null = null;
  ngOnInit(): void {
    this.pageSizeControl = new FormControl(DEFAULT_PAGE_SIZE, {
      nonNullable: true,
    });
    this.pageSizeChanged$ = this.pageSizeControl.valueChanges.pipe(
      tap((val) => {
        this.pageSizeChanged.emit(val);
        this.navigationService.navigate({
          route: ['.'],
          extras: {
            relativeTo: this.route,
            queryParams: {
              [LIMIT_QUERY_PARAM]: val,
              [CURSOR_QUERY_PARAM]: undefined,
              [NEXT_QUERY_PARAM]: undefined,
              [PREVIOUS_QUERY_PARAM]: undefined,
            },
            queryParamsHandling: 'merge',
            preserveFragment: true,
          },
        });
      })
    );
  }

  setCursor(cursor: string) {
    const params: { [key: string]: string | number } = {
      [LIMIT_QUERY_PARAM]: this.pageSizeControl.value,
      [CURSOR_QUERY_PARAM]: cursor,
    };
    this.cursor = cursor;
    this.navigationService.navigate({
      route: ['.'],
      extras: {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
        preserveFragment: true,
      },
    });
  }

  setNextAndPrevious(next: string | null, previous: string | null) {
    this.next = next;
    this.previous = previous;
  }
}
