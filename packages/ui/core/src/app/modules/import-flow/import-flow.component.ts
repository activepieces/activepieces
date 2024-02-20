import {
  PopulatedFlow,
  FlowOperationType,
  FlowTemplate,
  TelemetryEventName,
} from '@activepieces/shared';
import {
  FlagService,
  FlowService,
  RedirectService,
  TelemetryService,
  AuthenticationService,
  TemplatesService,
} from '@activepieces/ui/common';
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
  shareReplay,
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
  fullLogoUrl$: Observable<string>;
  constructor(
    private route: ActivatedRoute,
    private templatesService: TemplatesService,
    private flowService: FlowService,
    private router: Router,
    private metaService: Meta,
    private telemetryService: TelemetryService,
    private authenticationService: AuthenticationService,
    private flagService: FlagService,
    private redirectService: RedirectService
  ) {
    this.fullLogoUrl$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }

  ngOnInit(): void {
    this.loadFlow$ = this.route.params.pipe(
      switchMap((params) => {
        const templateId = encodeURIComponent(params['templateId']);
        return this.templatesService.getTemplate(templateId).pipe(
          catchError((err: HttpErrorResponse) => {
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
      }),
      shareReplay(1)
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
                  projectId: this.authenticationService.getProjectId(),
                  displayName: templateJson.template.displayName,
                })
                .pipe(
                  tap(() => {
                    this.telemetryService.capture({
                      name: TelemetryEventName.FLOW_IMPORTED,
                      payload: {
                        id: templateJson.id,
                        name: templateJson.name,
                        location: `import flow view`,
                      },
                    });
                  }),
                  switchMap((flow) => {
                    return this.flowService
                      .update(flow.id, {
                        type: FlowOperationType.IMPORT_FLOW,
                        request: templateJson.template,
                      })
                      .pipe(
                        tap((updatedFlow: PopulatedFlow) => {
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
            this.redirectService.setRedirectRouteToCurrentRoute();
            this.router.navigate(['/sign-in']);
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
