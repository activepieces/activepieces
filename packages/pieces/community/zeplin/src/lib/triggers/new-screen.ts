import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ziplinAuth } from '../common/auth';

export const newScreen = createTrigger({
  auth: ziplinAuth,
  name: 'newScreen',
  displayName: 'New Screen',
  description: 'Triggered when a new screen is created in a project',
  props: {},
  sampleData: {
    event: 'project.screen',
    action: 'created',
    timestamp: 1572347818,
    resource: {
      id: '5dbad85a76ea51c1f35b6f69',
      type: 'Screen',
      data: {
        id: '5dbad85a76ea51c1f35b6f69',
        name: 'Login',
        description: 'Login screen for HAL 9000',
        tags: ['mobile', 'login'],
        image: {
          width: 2560,
          height: 1920,
          original_url: 'http://placekitten.com/2560/1920',
          thumbnails: {
            small: 'http://placekitten.com/256/256',
            medium: 'http://placekitten.com/512/512',
            large: 'http://placekitten.com/1024/1024',
          },
        },
        created: 1517184000,
        updated: 1572347818,
        number_of_notes: 0,
        number_of_versions: 1,
        number_of_annotations: 0,
        section: {
          id: '5db81e6e6a4462065f04d932',
        },
        variant: {
          value: 'Default',
          group: {
            id: '607437cd62d37a0bc869fc63',
            name: 'Login',
          },
        },
      },
    },
    context: {
      project: {
        id: '5db81e73e1e36ee19f138c1a',
        name: 'HAL 9000',
        description:
          'UI designs for the onboard computer on the spaceship Discovery 1',
        platform: 'web',
        thumbnail: 'http://placekitten.com/200/300',
        status: 'active',
        scene_url: 'https://scene.zeplin.io/project/5db81e73e1e36ee19f138c1a',
        created: 1517184000,
        updated: 1572347818,
        number_of_members: 47,
        number_of_screens: 112,
        number_of_components: 46,
        number_of_connected_components: 32,
        number_of_text_styles: 28,
        number_of_colors: 17,
        linked_styleguide: {
          id: '5db81e6e6a4462065f04d932',
        },
      },
    },
    actor: {
      user: {
        id: '5d9caaecb4a3fa9bc9718686',
        email: '5d9caaecb4a3fa9bc9718686@user.zeplin.io',
        username: 'zozo',
        emotar: '🍎',
        avatar: 'http://placekitten.com/200/300',
        last_seen: 1616739240,
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // add webbhook  on the dashboard
  },
  async onDisable(context) {
    // No-op
  },
  async run(context) {
    return [context.payload.body];
  },
});
