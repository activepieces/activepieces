import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addPeopleToProject } from './lib/actions/add-people-to-project'
import { createCompany } from './lib/actions/create-company'
import { createExpense } from './lib/actions/create-expense'
import { createMessageReply } from './lib/actions/create-message-reply'
import { createMilestone } from './lib/actions/create-milestone'
import { createPerson } from './lib/actions/create-person'
import { createProject } from './lib/actions/create-project'
import { createTask } from './lib/actions/create-task'
import { createTaskComment } from './lib/actions/create-task-comment'
import { createTaskList } from './lib/actions/create-task-list'
import { createTimeEntryOnTask } from './lib/actions/create-time-entry-on-task'
import { findCompany } from './lib/actions/find-company'
import { findMilestone } from './lib/actions/find-milestone'
import { findNotebookOrComment } from './lib/actions/find-notebook-or-comment'
import { findTask } from './lib/actions/find-task'
import { markTaskComplete } from './lib/actions/mark-task-complete'
import { updateTask } from './lib/actions/update-task'
import { uploadFileToProject } from './lib/actions/upload-file-to-project'
import { teamworkAuth } from './lib/common/auth'
import { newComment } from './lib/triggers/new-comment'
import { newExpense } from './lib/triggers/new-expense'
import { newFile } from './lib/triggers/new-file'
import { newInvoice } from './lib/triggers/new-invoice'
import { newMessage } from './lib/triggers/new-message'
import { newPerson } from './lib/triggers/new-person'
import { newTask } from './lib/triggers/new-task'

export const teamwork = createPiece({
    displayName: 'Teamwork',
    description:
        'Teamwork is a work and project management tool that helps teams improve collaboration, visibility, and accountability.',
    auth: teamworkAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/teamwork.png',
    authors: ['sparkybug', 'onyedikachi-david'],
    categories: [PieceCategory.PRODUCTIVITY],
    actions: [
        createProject,
        createTaskList,
        createTask,
        markTaskComplete,
        createCompany,
        createPerson,
        updateTask,
        createTaskComment,
        createTimeEntryOnTask,
        createExpense,
        uploadFileToProject,
        createMessageReply,
        createMilestone,
        addPeopleToProject,
        findTask,
        findCompany,
        findMilestone,
        findNotebookOrComment,
    ],
    triggers: [newTask, newPerson, newComment, newMessage, newFile, newExpense, newInvoice],
})
