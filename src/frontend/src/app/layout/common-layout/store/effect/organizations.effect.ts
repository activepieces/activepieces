import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CommonActions } from '../action/common.action';
import { exhaustMap, map, of, switchMap } from 'rxjs';
import { OrganizationActions } from '../action/organizations.action';
import { OrganizationService } from '../../service/organization.service';
import { OrganizationSize } from '../../model/enum/organization-size';

@Injectable()
export class OrganizationsEffect {
	constructor(private actions$: Actions, private organizationService: OrganizationService) {}

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(CommonActions.loadInitial),
			exhaustMap(({ user }) => {
				return this.organizationService.list().pipe(
					switchMap(orgs => {
						if (orgs.length === 0) {
							return this.organizationService
								.create({
									name: user.company,
									size: OrganizationSize.UNKNOWN,
								})
								.pipe(
									map(org => {
										return OrganizationActions.setOrganizations({ organizations: [org] });
									})
								);
						}
						return of(
							OrganizationActions.setOrganizations({
								organizations: orgs,
							})
						);
					})
				);
			})
		);
	});

	clearState$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(CommonActions.clearState),
			map(({}) => {
				return OrganizationActions.clearOrganizations();
			})
		);
	});
}
