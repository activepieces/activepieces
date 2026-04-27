/* eslint-disable max-lines -- template CRUD + children management + issue-from-template form a single domain */
/**
 * Issue template domain operations for Huly MCP server.
 *
 * Provides typed operations for managing issue templates within Huly projects.
 * Operations use HulyClient service and return typed domain objects.
 *
 * @module
 */
import type { Channel, Person } from "@hcengineering/contact"
import type { Data, DocumentUpdate, Ref } from "@hcengineering/core"
import { generateId, SortingOrder } from "@hcengineering/core"
import type {
  Component as HulyComponent,
  Issue as HulyIssue,
  IssueParentInfo,
  IssueTemplate as HulyIssueTemplate,
  IssueTemplateChild as HulyIssueTemplateChild,
  Project as HulyProject
} from "@hcengineering/tracker"
import { Effect } from "effect"

import type {
  AddTemplateChildParams,
  CreateIssueFromTemplateParams,
  CreateIssueParams,
  CreateIssueTemplateParams,
  DeleteIssueTemplateParams,
  GetIssueTemplateParams,
  IssueTemplate,
  IssueTemplateChild,
  IssueTemplateSummary,
  ListIssueTemplatesParams,
  RemoveTemplateChildParams,
  UpdateIssueTemplateParams
} from "../../domain/schemas.js"
import type {
  AddTemplateChildResult,
  ChildTemplateInput,
  CreateIssueFromTemplateResult,
  CreateIssueTemplateResult,
  DeleteIssueTemplateResult,
  RemoveTemplateChildResult,
  UpdateIssueTemplateResult
} from "../../domain/schemas/issue-templates.js"
import {
  ComponentLabel,
  Email,
  IssueTemplateChildId,
  IssueTemplateId,
  NonNegativeNumber,
  PersonName
} from "../../domain/schemas/shared.js"
import type { HulyClient, HulyClientError } from "../client.js"
import type { InvalidStatusError, IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import {
  ComponentNotFoundError,
  IssueTemplateNotFoundError,
  PersonNotFoundError,
  TemplateChildNotFoundError
} from "../errors.js"
import { findComponentByIdOrLabel } from "./components.js"
import { createIssue } from "./issues.js"
import {
  findPersonByEmailOrName,
  findProject,
  priorityToString,
  stringToPriority,
  toRef,
  zeroAsUnset
} from "./shared.js"

import { contact, tracker } from "../huly-plugins.js"

type ListIssueTemplatesError =
  | HulyClientError
  | ProjectNotFoundError

type GetIssueTemplateError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueTemplateNotFoundError

type CreateIssueTemplateError =
  | HulyClientError
  | ProjectNotFoundError
  | PersonNotFoundError
  | ComponentNotFoundError

type CreateIssueFromTemplateError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | IssueTemplateNotFoundError
  | InvalidStatusError
  | PersonNotFoundError

type UpdateIssueTemplateError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueTemplateNotFoundError
  | PersonNotFoundError
  | ComponentNotFoundError

type DeleteIssueTemplateError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueTemplateNotFoundError

type AddTemplateChildError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueTemplateNotFoundError
  | PersonNotFoundError
  | ComponentNotFoundError

type RemoveTemplateChildError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueTemplateNotFoundError
  | TemplateChildNotFoundError

const findTemplateByIdOrTitle = (
  client: HulyClient["Type"],
  projectId: Ref<HulyProject>,
  templateIdOrTitle: string
): Effect.Effect<HulyIssueTemplate | undefined, HulyClientError> =>
  Effect.gen(function*() {
    const template = (yield* client.findOne<HulyIssueTemplate>(
      tracker.class.IssueTemplate,
      {
        space: projectId,
        _id: toRef<HulyIssueTemplate>(templateIdOrTitle)
      }
    )) ?? (yield* client.findOne<HulyIssueTemplate>(
      tracker.class.IssueTemplate,
      {
        space: projectId,
        title: templateIdOrTitle
      }
    ))

    return template
  })

const findProjectAndTemplate = (
  params: { project: string; template: string }
): Effect.Effect<
  { client: HulyClient["Type"]; project: HulyProject; template: HulyIssueTemplate },
  ProjectNotFoundError | IssueTemplateNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const template = yield* findTemplateByIdOrTitle(client, project._id, params.template)

    if (template === undefined) {
      return yield* new IssueTemplateNotFoundError({
        identifier: params.template,
        project: params.project
      })
    }

    return { client, project, template }
  })

// --- Child resolution helpers ---

/**
 * Resolve a single HulyIssueTemplateChild to our domain IssueTemplateChild.
 * Looks up assignee name and component label from refs.
 */
const resolveChild = (
  client: HulyClient["Type"],
  child: HulyIssueTemplateChild
): Effect.Effect<IssueTemplateChild, HulyClientError> =>
  Effect.gen(function*() {
    const assigneeName = child.assignee !== null
      ? (yield* client.findOne<Person>(contact.class.Person, { _id: child.assignee }))?.name
      : undefined

    const componentLabel = child.component !== null
      ? (yield* client.findOne<HulyComponent>(tracker.class.Component, { _id: child.component }))?.label
      : undefined

    const base: IssueTemplateChild = {
      id: IssueTemplateChildId.make(child.id),
      title: child.title,
      priority: priorityToString(child.priority)
    }

    // exactOptionalPropertyTypes: can't assign undefined to optional fields
    const withDescription = child.description
      ? { ...base, description: child.description }
      : base
    const withAssignee = assigneeName !== undefined
      ? { ...withDescription, assignee: PersonName.make(assigneeName) }
      : withDescription
    const withComponent = componentLabel !== undefined
      ? { ...withAssignee, component: ComponentLabel.make(componentLabel) }
      : withAssignee
    const estimation = zeroAsUnset(NonNegativeNumber.make(child.estimation))
    const result = estimation !== undefined
      ? { ...withComponent, estimation }
      : withComponent

    return result
  })

/**
 * Build a HulyIssueTemplateChild from a ChildTemplateInput, resolving assignee and component refs.
 */
const buildTemplateChild = (
  client: HulyClient["Type"],
  projectId: Ref<HulyProject>,
  projectIdentifier: string,
  input: ChildTemplateInput
): Effect.Effect<HulyIssueTemplateChild, PersonNotFoundError | ComponentNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    const assigneeParam = input.assignee
    const assigneeRef: Ref<Person> | null = assigneeParam !== undefined
      ? yield* Effect.gen(function*() {
        const person = yield* findPersonByEmailOrName(client, assigneeParam)
        if (person === undefined) {
          return yield* new PersonNotFoundError({ identifier: assigneeParam })
        }
        return person._id
      })
      : null

    const componentParam = input.component
    const componentRef: Ref<HulyComponent> | null = componentParam !== undefined
      ? yield* Effect.gen(function*() {
        const component = yield* findComponentByIdOrLabel(client, projectId, componentParam)
        if (component === undefined) {
          return yield* new ComponentNotFoundError({
            identifier: componentParam,
            project: projectIdentifier
          })
        }
        return component._id
      })
      : null

    return {
      id: generateId<HulyIssue>(),
      title: input.title,
      description: input.description ?? "",
      priority: stringToPriority(input.priority || "no-priority"),
      assignee: assigneeRef,
      component: componentRef,
      estimation: input.estimation ?? 0
    }
  })

// --- Operations ---

export const listIssueTemplates = (
  params: ListIssueTemplatesParams
): Effect.Effect<Array<IssueTemplateSummary>, ListIssueTemplatesError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const limit = Math.min(params.limit ?? 50, 200)

    const templates = yield* client.findAll<HulyIssueTemplate>(
      tracker.class.IssueTemplate,
      { space: project._id },
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    const summaries: Array<IssueTemplateSummary> = templates.map(t => {
      const base: IssueTemplateSummary = {
        id: IssueTemplateId.make(t._id),
        title: t.title,
        priority: priorityToString(t.priority),
        modifiedOn: t.modifiedOn
      }
      // exactOptionalPropertyTypes: only set childrenCount when > 0
      if (t.children.length > 0) {
        return { ...base, childrenCount: t.children.length }
      }
      return base
    })

    return summaries
  })

export const getIssueTemplate = (
  params: GetIssueTemplateParams
): Effect.Effect<IssueTemplate, GetIssueTemplateError, HulyClient> =>
  Effect.gen(function*() {
    const { client, template } = yield* findProjectAndTemplate(params)

    const assigneeName = template.assignee !== null
      ? (yield* client.findOne<Person>(contact.class.Person, { _id: template.assignee }))?.name
      : undefined

    const componentLabel = template.component !== null
      ? (yield* client.findOne<HulyComponent>(tracker.class.Component, { _id: template.component }))?.label
      : undefined

    const resolvedChildren: Array<IssueTemplateChild> = []
    for (const child of template.children) {
      resolvedChildren.push(yield* resolveChild(client, child))
    }

    const result: IssueTemplate = {
      id: IssueTemplateId.make(template._id),
      title: template.title,
      description: template.description,
      priority: priorityToString(template.priority),
      assignee: assigneeName !== undefined ? PersonName.make(assigneeName) : undefined,
      component: componentLabel !== undefined ? ComponentLabel.make(componentLabel) : undefined,
      estimation: zeroAsUnset(NonNegativeNumber.make(template.estimation)),
      project: params.project,
      modifiedOn: template.modifiedOn,
      createdOn: template.createdOn
    }

    // exactOptionalPropertyTypes: only set children when non-empty
    if (resolvedChildren.length > 0) {
      return { ...result, children: resolvedChildren }
    }
    return result
  })

export const createIssueTemplate = (
  params: CreateIssueTemplateParams
): Effect.Effect<CreateIssueTemplateResult, CreateIssueTemplateError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const templateId: Ref<HulyIssueTemplate> = generateId()

    const assigneeParam = params.assignee
    const assigneeRef: Ref<Person> | null = assigneeParam !== undefined
      ? yield* Effect.gen(function*() {
        const person = yield* findPersonByEmailOrName(client, assigneeParam)
        if (person === undefined) {
          return yield* new PersonNotFoundError({ identifier: assigneeParam })
        }
        return person._id
      })
      : null

    const componentParam = params.component
    const componentRef: Ref<HulyComponent> | null = componentParam !== undefined
      ? yield* Effect.gen(function*() {
        const component = yield* findComponentByIdOrLabel(client, project._id, componentParam)
        if (component === undefined) {
          return yield* new ComponentNotFoundError({
            identifier: componentParam,
            project: params.project
          })
        }
        return component._id
      })
      : null

    const priority = stringToPriority(params.priority || "no-priority")

    // Build children from input if provided
    const children: Array<HulyIssueTemplateChild> = []
    if (params.children !== undefined) {
      for (const childInput of params.children) {
        children.push(yield* buildTemplateChild(client, project._id, params.project, childInput))
      }
    }

    const templateData: Data<HulyIssueTemplate> = {
      title: params.title,
      description: params.description ?? "",
      priority,
      assignee: assigneeRef,
      component: componentRef,
      estimation: params.estimation ?? 0,
      children,
      comments: 0
    }

    yield* client.createDoc(
      tracker.class.IssueTemplate,
      project._id,
      templateData,
      templateId
    )

    return { id: IssueTemplateId.make(templateId), title: params.title }
  })

/**
 * Create an issue from a template, optionally including sub-issues from template children.
 *
 * Children are created as top-level issues via {@link createIssue} (which is battle-tested),
 * then reparented via updateDoc.
 *
 * HULY EVENTUAL CONSISTENCY: We cannot use addCollection or findOne to reference a
 * just-created parent issue — the client's live query won't see it yet, causing hangs.
 * Instead we create children as top-level issues and reparent them with updateDoc,
 * which works on just-created documents because it's a direct write (no ref resolution).
 */
export const createIssueFromTemplate = (
  params: CreateIssueFromTemplateParams
): Effect.Effect<CreateIssueFromTemplateResult, CreateIssueFromTemplateError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project, template } = yield* findProjectAndTemplate(params)

    const title = params.title ?? template.title
    const description = params.description ?? template.description
    const priority = params.priority ?? priorityToString(template.priority)

    const templateAssigneeRef = template.assignee
    const assignee = params.assignee !== undefined
      ? params.assignee
      : templateAssigneeRef !== null
      ? yield* Effect.gen(function*() {
        const person = yield* client.findOne<Person>(
          contact.class.Person,
          { _id: templateAssigneeRef }
        )
        if (person) {
          const emailCh = yield* client.findOne<Channel>(
            contact.class.Channel,
            {
              attachedTo: person._id,
              provider: contact.channelProvider.Email
            }
          )
          return Email.make(emailCh?.value ?? person.name)
        }
        return undefined
      })
      : undefined

    const issueParams: CreateIssueParams = {
      project: params.project,
      title,
      description,
      priority,
      assignee,
      status: params.status
    }

    const result = yield* createIssue(issueParams)

    if (template.component !== null) {
      yield* client.updateDoc(
        tracker.class.Issue,
        project._id,
        toRef<HulyIssue>(result.issueId),
        { component: template.component }
      )
    }

    // Create sub-issues from template children if includeChildren is not false
    const includeChildren = params.includeChildren !== false
    if (includeChildren && template.children.length > 0) {
      for (const child of template.children) {
        // Create child as top-level issue via createIssue (no parentIssue).
        // We can't pass parentIssue because createIssue uses findIssueInProject
        // which does findOne on the just-created parent — that hangs.
        const childDescription = child.description !== "" ? child.description : undefined
        const childResult = yield* createIssue({
          project: params.project,
          title: child.title,
          priority: priorityToString(child.priority),
          ...(childDescription !== undefined && { description: childDescription })
        })

        // Reparent to the parent issue and set additional fields from template child.
        // updateDoc works on just-created documents (proven by the component update above).
        const parentRef = toRef<HulyIssue>(result.issueId)
        const parents: Array<IssueParentInfo> = [{
          parentId: parentRef,
          identifier: result.identifier,
          parentTitle: title,
          space: project._id
        }]

        const reparentUpdate: DocumentUpdate<HulyIssue> = {
          attachedTo: parentRef,
          attachedToClass: tracker.class.Issue,
          collection: "subIssues",
          parents,
          ...(child.assignee !== null && { assignee: child.assignee }),
          ...(child.component !== null && { component: child.component }),
          ...(child.estimation > 0 && { estimation: child.estimation })
        }

        yield* client.updateDoc(
          tracker.class.Issue,
          project._id,
          toRef<HulyIssue>(childResult.issueId),
          reparentUpdate
        )
      }

      return {
        ...result,
        childrenCreated: template.children.length
      }
    }

    return result
  })

export const updateIssueTemplate = (
  params: UpdateIssueTemplateParams
): Effect.Effect<UpdateIssueTemplateResult, UpdateIssueTemplateError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project, template } = yield* findProjectAndTemplate(params)

    const updateOps: DocumentUpdate<HulyIssueTemplate> = {}

    if (params.title !== undefined) {
      updateOps.title = params.title
    }

    if (params.description !== undefined) {
      updateOps.description = params.description
    }

    if (params.priority !== undefined) {
      updateOps.priority = stringToPriority(params.priority)
    }

    if (params.assignee !== undefined) {
      if (params.assignee === null) {
        updateOps.assignee = null
      } else {
        const person = yield* findPersonByEmailOrName(client, params.assignee)
        if (person === undefined) {
          return yield* new PersonNotFoundError({ identifier: params.assignee })
        }
        updateOps.assignee = person._id
      }
    }

    if (params.component !== undefined) {
      if (params.component === null) {
        updateOps.component = null
      } else {
        const component = yield* findComponentByIdOrLabel(client, project._id, params.component)
        if (component === undefined) {
          return yield* new ComponentNotFoundError({
            identifier: params.component,
            project: params.project
          })
        }
        updateOps.component = component._id
      }
    }

    if (params.estimation !== undefined) {
      updateOps.estimation = params.estimation
    }

    if (Object.keys(updateOps).length === 0) {
      return { id: IssueTemplateId.make(template._id), updated: false }
    }

    yield* client.updateDoc(
      tracker.class.IssueTemplate,
      project._id,
      template._id,
      updateOps
    )

    return { id: IssueTemplateId.make(template._id), updated: true }
  })

export const deleteIssueTemplate = (
  params: DeleteIssueTemplateParams
): Effect.Effect<DeleteIssueTemplateResult, DeleteIssueTemplateError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project, template } = yield* findProjectAndTemplate(params)

    yield* client.removeDoc(
      tracker.class.IssueTemplate,
      project._id,
      template._id
    )

    return { id: IssueTemplateId.make(template._id), deleted: true }
  })

export const addTemplateChild = (
  params: AddTemplateChildParams
): Effect.Effect<AddTemplateChildResult, AddTemplateChildError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project, template } = yield* findProjectAndTemplate(params)

    const child = yield* buildTemplateChild(client, project._id, params.project, {
      title: params.title,
      description: params.description,
      priority: params.priority,
      assignee: params.assignee,
      component: params.component,
      estimation: params.estimation
    })

    const newChildren = [...template.children, child]

    yield* client.updateDoc(
      tracker.class.IssueTemplate,
      project._id,
      template._id,
      { children: newChildren }
    )

    return {
      id: IssueTemplateChildId.make(child.id),
      title: child.title,
      added: true
    }
  })

export const removeTemplateChild = (
  params: RemoveTemplateChildParams
): Effect.Effect<RemoveTemplateChildResult, RemoveTemplateChildError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project, template } = yield* findProjectAndTemplate(params)

    // String() needed: c.id is Ref<Issue>, params.childId is IssueTemplateChildId — both plain strings at runtime
    const childIndex = template.children.findIndex(c => String(c.id) === String(params.childId))
    if (childIndex === -1) {
      return yield* new TemplateChildNotFoundError({
        childId: params.childId,
        template: params.template,
        project: params.project
      })
    }

    const removedChild = template.children[childIndex]
    const newChildren = template.children.filter((_, i) => i !== childIndex)

    yield* client.updateDoc(
      tracker.class.IssueTemplate,
      project._id,
      template._id,
      { children: newChildren }
    )

    return {
      id: IssueTemplateChildId.make(removedChild.id),
      title: removedChild.title,
      removed: true
    }
  })
