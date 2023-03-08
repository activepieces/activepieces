import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import {
  ActionType,
  PieceOptionRequest,
  TriggerType,
} from '@activepieces/shared';
import { HttpClient } from '@angular/common/http';
import {
  AppPiece,
  PieceProperty,
} from '../../common/components/configs-form/connector-action-or-config';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ActionMetaService {
  private pieces$: Observable<AppPiece[]>;
  public coreFlowItemsDetails: FlowItemDetails[] = [
    {
      type: ActionType.CODE,
      name: 'Code',
      description: 'Powerful nodejs & typescript code with npm',
      logoUrl: '/assets/img/custom/piece/code.svg',
    },
    {
      type: ActionType.BRANCH,
      name: 'Branch',
      description: 'Branchy branch ranch',
      logoUrl: '/assets/img/custom/piece/branch.svg',
    },
  ];

  public triggerItemsDetails = [
    {
      type: TriggerType.SCHEDULE,
      name: 'Schedule',
      description: 'Trigger flow with fixed schedule.',
      logoUrl: '/assets/img/custom/piece/schedule.svg',
    },
    {
      type: TriggerType.WEBHOOK,
      name: 'Webhook',
      description: 'Trigger flow by calling a unique web url',
      logoUrl: '/assets/img/custom/piece/webhook.svg',
    },
    {
      type: TriggerType.EMPTY,
      name: 'Trigger',
      description: 'Choose a trigger',
      logoUrl: '/assets/img/custom/piece/empty-trigger.svg',
    },
  ];
  constructor(private http: HttpClient) {}

  public getPieces() {
    if (!this.pieces$) {
      this.pieces$ = this.http
        .get<AppPiece[]>(environment.apiUrl + '/pieces')
        .pipe(shareReplay(1));
    }
    return this.pieces$;
  }
  getPieceActionConfigOptions<
    T extends DropdownState<any> | Record<string, PieceProperty>
  >(req: PieceOptionRequest, pieceName: string) {
    return this.http.post<T>(
      environment.apiUrl + `/pieces/${pieceName}/options`,
      req
    );
  }
}
export type DropdownState<T> = {
  disabled?: boolean;
  placeholder?: string;
  options: DropdownOption<T>[];
};

export type DropdownOption<T> = {
  label: string;
  value: T;
};
