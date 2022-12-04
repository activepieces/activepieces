import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiDropdownFormControl } from 'src/app/layout/common-layout/model/dynamic-controls/multi-dropdown-form-control';
import { OnboardingTechnicalLevelEnum } from 'src/app/layout/common-layout/model/enum/onboarding-technical-level.enum';
import { OnboardingUsecasesEnum } from 'src/app/layout/common-layout/model/enum/onboarding-usecases.enum';
import { OnboardingUserRoleEnum } from 'src/app/layout/common-layout/model/enum/onboarding-user-role.enum';
import { OnboardingService } from 'src/app/layout/common-layout/service/onboarding.service';
import { fadeInUp400ms } from '../../../../common-layout/animation/fade-in-up.animation';

@Component({
	selector: 'app-on-boarding-form',
	templateUrl: './on-boarding-form.component.html',
	styleUrls: ['./on-boarding-form.component.scss'],
	animations: [fadeInUp400ms],
})
export class OnBoardingFormComponent implements OnInit {
	onBoardingForm: FormGroup;
	multiDropDownController: MultiDropdownFormControl;
	@Input() animationDone = false;
	submitted = false;
	loading: boolean = false;
	useCasesDropdownOptions = [
		{
			value: OnboardingUsecasesEnum.LOAD_DATA_INTO_WAREHOUSE,
			label: 'Load data into warehouse',
		},
		{
			value: OnboardingUsecasesEnum.SEND_DATA_INT_DIFFERENT_TOOLS,
			label: 'Send data to different tools',
		},
		{
			value: OnboardingUsecasesEnum.COLLECT_USER_DATA,
			label: 'Collect user data',
		},
		{
			value: OnboardingUsecasesEnum.AUTOMATE_MANUAL_WORK,
			label: 'Automate  manual work',
		},
		{
			value: OnboardingUsecasesEnum.INTEGRATE_DIFFERENT_TOOL,
			label: 'Integrate different tools',
		},
	];

	roleDropdownOptions = [
		{ value: OnboardingUserRoleEnum.DEVELOPER, label: 'Developer' },
		{
			value: OnboardingUserRoleEnum.MARKETING_MANAGER,
			label: 'Marketing Manager',
		},
		{ value: OnboardingUserRoleEnum.PRODUCT_MANAGER, label: 'Product Manager' },
		{
			value: OnboardingUserRoleEnum.QUALITY_ENGINEER,
			label: 'Quality Engineer',
		},
		{ value: OnboardingUserRoleEnum.OTHER, label: 'Other' },
	];

	technicalLevelDropdownOptions = [
		{
			value: OnboardingTechnicalLevelEnum.NOT_DEVELOPER,
			label: "I'm not a developer",
		},
		{
			value: OnboardingTechnicalLevelEnum.STIlL_LEARNING,
			label: 'Still Leanring',
		},
		{ value: OnboardingTechnicalLevelEnum.BEGINNER, label: 'Beginner' },
		{ value: OnboardingTechnicalLevelEnum.INTERMEDIATE, label: 'Intermediate' },
		{ value: OnboardingTechnicalLevelEnum.EXPERT, label: 'Expert' },
		{
			value: OnboardingTechnicalLevelEnum.LOW_CODE,
			label: 'Low Code/No Code Developer',
		},
	];
	constructor(private router: Router, private formBuilder: FormBuilder, private onBoardingService: OnboardingService) {}

	ngOnInit(): void {
		this.onBoardingForm = this.formBuilder.group({
			role: [, [Validators.required]],
			usecases: [, Validators.required],
			technicalLevel: [, Validators.required],
		});
	}

	navigateToDashboard() {
		this.router.navigate(['/']).then(value => {});
	}
	submit() {
		this.submitted = true;
		if (this.onBoardingForm.valid) {
			this.loading = true;
			const request = this.onBoardingForm.value;
			this.onBoardingService.submitOnboardingQuestions(request).subscribe(() => {
				this.loading = false;
				this.navigateToDashboard();
			});
		}
	}
	get roleControl() {
		return this.onBoardingForm.get('role');
	}
	get technicalLevelControl() {
		return this.onBoardingForm.get('technicalLevel');
	}
	get usecasesControl() {
		return this.onBoardingForm.get('usecases');
	}
}
