import { Flow, FlowOperationType, FlowTemplate } from '@activepieces/shared';
import { FlowService, TemplatesService } from '@activepieces/ui/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { StatusCodes } from 'http-status-codes';
import {
  catchError,
  EMPTY,
  Observable,
  switchMap,
  tap,
  map,
  filter,
  of,
} from 'rxjs';

@Component({
  selector: 'app-import-flow',
  templateUrl: './import-flow.component.html',
  styleUrls: [],
})
export class ImportFlowComponent implements OnInit {
  loadFlow$: Observable<FlowTemplate>;

  importFlow$: Observable<void>;
  hasDirectFlag$: Observable<boolean> = of(false);

  constructor(
    private route: ActivatedRoute,
    private templatesService: TemplatesService,
    private flowService: FlowService,
    private router: Router,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.loadFlow$ = this.route.params.pipe(
      switchMap((params) => {
        const templateId = encodeURIComponent(params['templateId']);
        return this.templatesService.getTemplate(templateId).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === StatusCodes.NOT_FOUND) {
              return this.templatesService.getTemplateDeprecated(templateId);
            }
            throw err;
          })
        );
      }),
      tap((res) => {
        this.metaService.addTag({
          name: 'description',
          content: `Use this Activepieces automation template for yourself: ${res.name}`,
        });
      }),
      catchError((error) => {
        console.error(error);
        this.router.navigate(['not-found']);
        return EMPTY;
      })
    );

    this.hasDirectFlag$ = this.route.queryParamMap.pipe(
      map((queryParams) => queryParams.has('direct'))
    );
    this.importFlow$ = this.loadFlow$
      .pipe(
        switchMap((templateJson) => {
          return this.route.queryParamMap.pipe(
            map((queryParams) => queryParams.has('direct')),
            filter((hasDirectFlag) => hasDirectFlag), // Only continue if 'direct' flag is present
            switchMap(() => {
              return this.flowService
                .create({
                  displayName: templateJson.template.displayName,
                })
                .pipe(
                  switchMap((flow) => {
                    return this.flowService
                      .update(flow.id, {
                        type: FlowOperationType.IMPORT_FLOW,
                        request: templateJson.template,
                      })
                      .pipe(
                        tap((updatedFlow: Flow) => {
                          this.router.navigate(['flows', updatedFlow.id]);
                        })
                      );
                  })
                );
            })
          );
        }),
        catchError((error) => {
          console.error(error);
          if (error.status === StatusCodes.UNAUTHORIZED) {
            this.router.navigate(['/sign-up'], {
              queryParams: {
                redirect_url:
                  `${window.location.origin}${window.location.pathname}`.split(
                    '?'
                  )[0],
              },
            });
            return EMPTY;
          }
          this.router.navigate(['not-found']);
          return EMPTY;
        })
      )
      .pipe(map(() => void 0));
  }

  dashboard() {
    this.router.navigate(['/flows']);
  }

  import() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        direct: true,
      },
    });
  }
}
