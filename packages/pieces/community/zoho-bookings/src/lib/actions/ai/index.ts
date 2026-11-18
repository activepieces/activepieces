import { zohoBookingsAddStaffAction } from './add-staff';
import { zohoBookingsBookAppointmentAction } from './book-appointment';
import { zohoBookingsCreateCustomerAction } from './create-customer';
import { zohoBookingsCreateDateOverridesAction } from './create-date-overrides';
import { zohoBookingsCreateResourceAction } from './create-resource';
import { zohoBookingsCreateServiceAction } from './create-service';
import { zohoBookingsCreateWorkspaceAction } from './create-workspace';
import { zohoBookingsDeleteCustomerAction } from './delete-customer';
import { zohoBookingsDeleteDateOverridesAction } from './delete-date-overrides';
import { zohoBookingsDeleteResourceAction } from './delete-resource';
import { zohoBookingsDeleteServiceAction } from './delete-service';
import { zohoBookingsDeleteWorkspaceAction } from './delete-workspace';
import { zohoBookingsGetAppointmentAction } from './get-appointment';
import { zohoBookingsGetAvailableSlotsAction } from './get-available-slots';
import { zohoBookingsListAppointmentsAction } from './list-appointments';
import { zohoBookingsListDateOverridesAction } from './list-date-overrides';
import { zohoBookingsListResourcesAction } from './list-resources';
import { zohoBookingsListServicesAction } from './list-services';
import { zohoBookingsListStaffAction } from './list-staff';
import { zohoBookingsListWorkspacesAction } from './list-workspaces';
import { zohoBookingsRescheduleAppointmentAction } from './reschedule-appointment';
import { zohoBookingsUpdateAppointmentDetailsAction } from './update-appointment-details';
import { zohoBookingsUpdateAppointmentStatusAction } from './update-appointment-status';
import { zohoBookingsUpdateCustomerAction } from './update-customer';
import { zohoBookingsUpdateDateOverridesAction } from './update-date-overrides';
import { zohoBookingsUpdateResourceAction } from './update-resource';
import { zohoBookingsUpdateServiceAction } from './update-service';
import { zohoBookingsUpdateWorkspaceAction } from './update-workspace';

export const zohoBookingsAiActions = [
	zohoBookingsBookAppointmentAction,
	zohoBookingsGetAppointmentAction,
	zohoBookingsListAppointmentsAction,
	zohoBookingsUpdateAppointmentStatusAction,
	zohoBookingsUpdateAppointmentDetailsAction,
	zohoBookingsRescheduleAppointmentAction,
	zohoBookingsGetAvailableSlotsAction,
	zohoBookingsListWorkspacesAction,
	zohoBookingsCreateWorkspaceAction,
	zohoBookingsUpdateWorkspaceAction,
	zohoBookingsDeleteWorkspaceAction,
	zohoBookingsListServicesAction,
	zohoBookingsCreateServiceAction,
	zohoBookingsUpdateServiceAction,
	zohoBookingsDeleteServiceAction,
	zohoBookingsListStaffAction,
	zohoBookingsAddStaffAction,
	zohoBookingsListResourcesAction,
	zohoBookingsCreateResourceAction,
	zohoBookingsUpdateResourceAction,
	zohoBookingsDeleteResourceAction,
	zohoBookingsCreateCustomerAction,
	zohoBookingsUpdateCustomerAction,
	zohoBookingsDeleteCustomerAction,
	zohoBookingsListDateOverridesAction,
	zohoBookingsCreateDateOverridesAction,
	zohoBookingsUpdateDateOverridesAction,
	zohoBookingsDeleteDateOverridesAction,
];
