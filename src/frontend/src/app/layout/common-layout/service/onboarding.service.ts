import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { OnboardingUserRoleEnum } from '../model/enum/onboarding-user-role.enum';
import { OnboardingUsecasesEnum } from '../model/enum/onboarding-usecases.enum';
import { OnboardingTechnicalLevelEnum } from '../model/enum/onboarding-technical-level.enum';

@Injectable({
	providedIn: 'root',
})
export class OnboardingService {
	constructor(private http: HttpClient) {}

	submitOnboardingQuestions(request: {
		role: OnboardingUserRoleEnum;
		usecases: OnboardingUsecasesEnum[];
		technicalLevel: OnboardingTechnicalLevelEnum;
	}): Observable<void> {
		return this.http.post<void>(environment.apiUrl + '/onboarding-questions', request);
	}
}
