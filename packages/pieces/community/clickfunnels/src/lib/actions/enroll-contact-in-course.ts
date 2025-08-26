import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';

export const enrollContactInCourse = createAction({
    name: 'enroll_contact_in_course',
    displayName: 'Enroll Contact Into Course',
    description: 'Create an enrollment for a contact in a course',
    auth: clickfunnelsAuth,
    props: {
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to enroll',
            required: true,
        }),
        course_id: Property.Dropdown({
            displayName: 'Course',
            description: 'Select the course to enroll the contact in',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                try {
                    const subdomain = clickfunnelsCommon.extractSubdomain(auth as any);
                    const response = await clickfunnelsCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: '/courses',
                        subdomain,
                    });

                    return {
                        disabled: false,
                        options: response.body.map((course: any) => ({
                            label: course.name,
                            value: course.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading courses'
                    };
                }
            }
        }),
        suspended: Property.Checkbox({
            displayName: 'Suspended',
            description: 'Whether the enrollment should be suspended',
            required: false,
            defaultValue: false,
        }),
        suspension_reason: Property.ShortText({
            displayName: 'Suspension Reason',
            description: 'Reason for suspension (only used if suspended is true)',
            required: false,
        }),
        origination_source_type: Property.ShortText({
            displayName: 'Origination Source Type',
            description: 'Type of source that originated this enrollment (e.g., Membership, Manual)',
            required: false,
        }),
        origination_source_id: Property.Number({
            displayName: 'Origination Source ID',
            description: 'ID of the source that originated this enrollment',
            required: true,
        }),
    },
    async run(context) {
        const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
        const courseId = context.propsValue.course_id;
        
        try {
            const existingEnrollmentsResponse = await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/courses/${courseId}/enrollments`,
                queryParams: {
                    'filter[contact_id]': context.propsValue.contact_id
                },
                subdomain,
            });

            if (existingEnrollmentsResponse.body.length > 0) {
                const existingEnrollment = existingEnrollmentsResponse.body.find(
                    (enrollment: any) => enrollment.contact_id === parseInt(context.propsValue.contact_id)
                );
                
                if (existingEnrollment) {
                    return {
                        ...existingEnrollment,
                        message: 'Contact already enrolled in course'
                    };
                }
            }
        } catch (error) {
        }

        const coursesEnrollment: Record<string, any> = {
            contact_id: parseInt(context.propsValue.contact_id),
            origination_source_id: context.propsValue.origination_source_id,
        };

        if (context.propsValue.suspended !== undefined) {
            coursesEnrollment['suspended'] = context.propsValue.suspended;
        }

        if (context.propsValue.suspension_reason) {
            coursesEnrollment['suspension_reason'] = context.propsValue.suspension_reason;
        }

        if (context.propsValue.origination_source_type) {
            coursesEnrollment['origination_source_type'] = context.propsValue.origination_source_type;
        }

        const response = await clickfunnelsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: `/courses/${courseId}/enrollments`,
            body: { courses_enrollment: coursesEnrollment },
            subdomain,
        });

        return response.body;
    },
});
