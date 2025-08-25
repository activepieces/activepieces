import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

export const enrollContactInCourseAction = createAction({
    // Use the authentication defined in common.ts
    auth: clickfunnelsAuth,
    name: 'enroll_contact_in_course',
    displayName: 'Enroll Contact in Course',
    description: 'Creates an enrollment for a specific contact in a course.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        course_id: Property.Number({
            displayName: 'Course ID',
            description: 'The numeric ID of the course to enroll the contact in.',
            required: true,
        }),
        contact_id: Property.Number({
            displayName: 'Contact ID',
            description: 'The numeric ID of the contact to be enrolled.',
            required: true,
        }),
    },

    async run(context) {
        // Destructure properties from the input
        const { 
            subdomain,
            course_id, 
            contact_id
        } = context.propsValue;
        
        // Construct the HTTP request
        const request: HttpRequest = {
            method: HttpMethod.POST,
            // The URL is built dynamically using the user-provided subdomain and course ID
            url: `https://${subdomain}.myclickfunnels.com/api/v2/courses/${course_id}/enrollments`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: {
                // As per the API docs pattern, the payload is nested within a 'courses_enrollment' object
                courses_enrollment: {
                    contact_id: contact_id,
                }
            }
        };

        // Send the request and return the response body
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});