import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItemDetails } from '../../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionMetaService } from '../../../service/action-meta.service';
import { FlowItemDetailsActions } from './flow-items-details.action';
import { AppPiece } from '../../../../common/components/configs-form/connector-action-or-config';

@Injectable()
export class FlowItemsDetailsEffects {
  load$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowItemDetailsActions.loadFlowItemsDetails),
      switchMap(() => {
        const components$ = this.flowItemsDetailsService.getPieces();
        const coreTriggersFlowItemsDetails$ = of(
          this.flowItemsDetailsService.triggerItemsDetails
        );
        const customPiecesTriggersFlowItemDetails$ = components$.pipe(
          map(this.createFlowItemDetailsForComponents(true))
        );
        const customPiecesActions$ = components$.pipe(
          map(this.createFlowItemDetailsForComponents(false))
        );
        const coreFlowItemsDetails$ = of(
          this.flowItemsDetailsService.coreFlowItemsDetails
        );
        return forkJoin({
          coreFlowItemsDetails: coreFlowItemsDetails$,
          coreTriggerFlowItemsDetails: coreTriggersFlowItemsDetails$,
          customPiecesActionsFlowItemDetails: customPiecesActions$,
          customPiecesTriggersFlowItemDetails:
            customPiecesTriggersFlowItemDetails$,
        });
      }),
      map((res) => {
        const storagePiece = res.customPiecesActionsFlowItemDetails.find(
          (p) => p.extra?.appName === 'storage'
        );
        const httpPiece = res.customPiecesActionsFlowItemDetails.find(
          (p) => p.extra?.appName === 'http'
        );
        if (storagePiece) {
          res.coreFlowItemsDetails = [
            ...res.coreFlowItemsDetails,
            storagePiece,
          ];
          const index = res.customPiecesActionsFlowItemDetails.findIndex(
            (p) => p.extra?.appName === 'storage'
          );
          res.customPiecesActionsFlowItemDetails.splice(index, 1);
        }
        if (httpPiece) {
          res.coreFlowItemsDetails = [...res.coreFlowItemsDetails, httpPiece];
          const index = res.customPiecesActionsFlowItemDetails.findIndex(
            (p) => p.extra?.appName === 'http'
          );
          res.customPiecesActionsFlowItemDetails.splice(index, 1);
        }
        return res;
      }),
      switchMap((res) => {
        return of(
          FlowItemDetailsActions.flowItemsDetailsLoadedSuccessfully({
            flowItemsDetailsLoaded: { ...res, loaded: true },
          })
        );
      })
    );
  });
  createFlowItemDetailsForComponents(forTriggers: boolean) {
    return (components: AppPiece[]) => {
      return components
        .map((c) => {
          if (Object.keys(c.actions).length > 0 && !forTriggers) {
            return new FlowItemDetails(
              ActionType.PIECE,
              c.displayName,
              c.description ? c.description : ``,
              c.logoUrl,
              { appName: c.name }
            );
          } else if (Object.keys(c.triggers).length > 0 && forTriggers) {
            return new FlowItemDetails(
              TriggerType.PIECE,
              c.displayName,
              ``,
              c.logoUrl,
              { appName: c.name }
            );
          } else {
            return null;
          }
        })
        .filter((res) => res !== null) as FlowItemDetails[];
    };
  }
  constructor(
    private actions$: Actions,
    private flowItemsDetailsService: ActionMetaService
  ) {}
}
