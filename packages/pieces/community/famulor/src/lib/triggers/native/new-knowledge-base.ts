import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newKnowledgeBaseDefinition: PollDefinition = {
  "name": "newKnowledgeBase",
  "displayName": "New Knowledge Base",
  "description": "Triggers when a knowledge base is created.",
  "path": "/knowledge-bases",
  "timeField": "created_at"
};
const newKnowledgeBase = createPollingTrigger(newKnowledgeBaseDefinition);

export { newKnowledgeBase, newKnowledgeBaseDefinition };
