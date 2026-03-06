import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

interface KnowBe4Enrollment {
  enrollment_id: number;
  campaign_name: string;
  module_name: string;
  enrollment_date: string;
  start_date: string | null;
  completion_date: string | null;
  status: string;
  time_spent: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const newTrainingEnrollment = createTrigger({
  auth: knowbe4Auth,
  name: 'new_training_enrollment',
  displayName: 'New Training Enrollment',
  description:
    'Triggers when a new training enrollment is created in your KnowBe4 account',
  props: {},
  sampleData: {
    enrollment_id: 456789,
    campaign_name: 'Q1 2026 Security Awareness',
    module_name: 'Security Essentials 2026',
    enrollment_date: '2026-01-15T00:00:00.000Z',
    start_date: null,
    completion_date: null,
    status: 'Not Started',
    time_spent: 0,
    user: {
      id: 12345,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const enrollments = await knowbe4ApiRequest<KnowBe4Enrollment[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/training/enrollments',
      queryParams: { per_page: '500' },
    });

    const maxId =
      enrollments.length > 0
        ? Math.max(...enrollments.map((e) => e.enrollment_id))
        : 0;
    await context.store.put('lastEnrollmentId', String(maxId));
  },
  async onDisable(context) {
    await context.store.delete('lastEnrollmentId');
  },
  async run(context) {
    const lastIdStr =
      (await context.store.get<string>('lastEnrollmentId')) ?? '0';
    const lastId = parseInt(lastIdStr, 10);

    const enrollments = await knowbe4ApiRequest<KnowBe4Enrollment[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/training/enrollments',
      queryParams: { per_page: '500' },
    });

    const newEnrollments = enrollments.filter(
      (e) => e.enrollment_id > lastId
    );

    if (newEnrollments.length > 0) {
      const maxId = Math.max(
        ...newEnrollments.map((e) => e.enrollment_id)
      );
      await context.store.put('lastEnrollmentId', String(maxId));
    }

    return newEnrollments;
  },
  async test(context) {
    const enrollments = await knowbe4ApiRequest<KnowBe4Enrollment[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/training/enrollments',
      queryParams: { per_page: '5' },
    });

    return enrollments;
  },
});
