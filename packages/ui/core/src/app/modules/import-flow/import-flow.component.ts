import { FlowOperationType } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-import-flow',
  templateUrl: './import-flow.component.html',
  styleUrls: [],
})
export class ImportFlowComponent implements OnInit {
  loadFlow$: Observable<void> = new Observable<void>();
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private flowService: FlowService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.loadFlow$ = this.route.params
      .pipe(
        switchMap((params) => {
          const templateId = encodeURIComponent(params['templateId']);
          return this.http
            .get<{ template: { displayName: string; trigger: any } }>(
              `https://cdn.activepieces.com/templates/${templateId}.json`
            )
            .pipe(
              switchMap((templateJson) => {
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
                          tap((updatedFlow) => {
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
          this.router.navigate(['not-found']);
          return of(null);
        })
      )
      .pipe(map(() => void 0));
  }
}
