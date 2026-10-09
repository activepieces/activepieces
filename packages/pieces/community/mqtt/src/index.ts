import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mqttAuth } from './lib/auth';
import { publishMessage } from './lib/actions/publish-message';
import { newMessage } from './lib/triggers/new-message';

const MQTT_LOGO =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjM0IDI5IDIwMy41IDIwMy41Ij48cGF0aCBmaWxsPSIjNjYwMDY2IiBkPSJNMzQuOSwxNDRjLTAuMiwwLTAuNCwwLTAuNiwwdjc3LjZjMCw1LjYsNC42LDEwLjIsMTAuMiwxMC4yaDc5LjlDMTIzLjcsMTgzLjMsODMuOCwxNDQsMzQuOSwxNDR6Ii8+PHBhdGggZmlsbD0iIzY2MDA2NiIgZD0iTTM0LjksODBjLTAuMiwwLTAuNCwwLTAuNiwwdjMzYzY1LjksMC4zLDExOS41LDUzLjMsMTIwLjIsMTE4LjhoMzQuMkMxODguMSwxNDgsMTE5LjMsODAsMzQuOSw4MHoiLz48cGF0aCBmaWxsPSIjNjYwMDY2IiBkPSJNMjM3LjIsMjIxLjd2LTcwLjFDMjE0LDk0LjgsMTY3LjMsNTAsMTA5LjEsMjlINDQuNWMtNS42LDAtMTAuMiw0LjYtMTAuMiwxMC4yVjQ5IGMxMDEuNCwwLjMsMTgzLjksODIsMTg0LjUsMTgyLjhoOC4yQzIzMi42LDIzMS44LDIzNy4yLDIyNy4zLDIzNy4yLDIyMS43eiIvPjxwYXRoIGZpbGw9IiM2NjAwNjYiIGQ9Ik0yMTAuNSw1Ny4zYzkuNCw5LjQsMTksMjEuMywyNi43LDMxLjh2LTUwYzAtNS42LTQuNS0xMC4xLTEwLjEtMTAuMWgtNTEuNSBDMTg3LjUsMzcuMywxOTkuOSw0Ni44LDIxMC41LDU3LjN6Ii8+PC9zdmc+';

export const mqtt = createPiece({
  displayName: 'MQTT',
  description:
    'Publish and receive messages on any MQTT broker (Mosquitto, EMQX, HiveMQ, AWS IoT, Azure IoT Hub...).',
  minimumSupportedRelease: '0.88.2',
  logoUrl: MQTT_LOGO,
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['rungeard'],
  auth: mqttAuth,
  actions: [publishMessage],
  triggers: [newMessage],
});
