import { generateCadModelAction } from './ml/generate-cad-model.action'
import { getCadModelAction } from './ml/get-cad-model.action'
import { giveModelFeedbackAction } from './ml/give-model-feedback.action'
import { kclCompletionsAction } from './ml/kcl-completions.action'
import { listCadModelsAction } from './ml/list-cad-models.action'
import { textToCadIterationAction } from './ml/text-to-cad-iteration.action'

export const ML_ACTIONS = [
  generateCadModelAction,
  kclCompletionsAction,
  textToCadIterationAction,
  listCadModelsAction,
  getCadModelAction,
  giveModelFeedbackAction,
]
