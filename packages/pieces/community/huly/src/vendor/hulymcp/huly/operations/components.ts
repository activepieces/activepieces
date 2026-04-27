/**
 * Component domain operations for Huly MCP server.
 *
 * Provides typed operations for managing components within Huly projects.
 * Operations use HulyClient service and return typed domain objects.
 *
 * @module
 */
import type { Employee, Person } from "@hcengineering/contact"
import type { Data, DocumentUpdate, Ref } from "@hcengineering/core"
import { generateId, SortingOrder } from "@hcengineering/core"
import type { Component as HulyComponent, Project as HulyProject } from "@hcengineering/tracker"
import { Effect } from "effect"

import type {
  Component,
  ComponentSummary,
  CreateComponentParams,
  DeleteComponentParams,
  GetComponentParams,
  ListComponentsParams,
  SetIssueComponentParams,
  UpdateComponentParams
} from "../../domain/schemas.js"
import type {
  CreateComponentResult,
  DeleteComponentResult,
  SetIssueComponentResult,
  UpdateComponentResult
} from "../../domain/schemas/components.js"
import { ComponentId, ComponentLabel, IssueIdentifier, PersonName } from "../../domain/schemas/shared.js"
import { isExistent } from "../../utils/assertions.js"
import type { HulyClient, HulyClientError } from "../client.js"
import type { IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import { ComponentNotFoundError, PersonNotFoundError } from "../errors.js"
import { findPersonByEmailOrName, findProject, findProjectAndIssue, toRef } from "./shared.js"

import { contact, tracker } from "../huly-plugins.js"

type ListComponentsError =
  | HulyClientError
  | ProjectNotFoundError

type GetComponentError =
  | HulyClientError
  | ProjectNotFoundError
  | ComponentNotFoundError

type CreateComponentError =
  | HulyClientError
  | ProjectNotFoundError
  | PersonNotFoundError

type UpdateComponentError =
  | HulyClientError
  | ProjectNotFoundError
  | ComponentNotFoundError
  | PersonNotFoundError

type SetIssueComponentError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | ComponentNotFoundError

type DeleteComponentError =
  | HulyClientError
  | ProjectNotFoundError
  | ComponentNotFoundError

export const findComponentByIdOrLabel = (
  client: HulyClient["Type"],
  projectId: Ref<HulyProject>,
  componentIdOrLabel: string
): Effect.Effect<HulyComponent | undefined, HulyClientError> =>
  Effect.gen(function*() {
    const component = (yield* client.findOne<HulyComponent>(
      tracker.class.Component,
      {
        space: projectId,
        _id: toRef<HulyComponent>(componentIdOrLabel)
      }
    )) ?? (yield* client.findOne<HulyComponent>(
      tracker.class.Component,
      {
        space: projectId,
        label: componentIdOrLabel
      }
    ))

    return component
  })

const findProjectAndComponent = (
  params: { project: string; component: string }
): Effect.Effect<
  { client: HulyClient["Type"]; project: HulyProject; component: HulyComponent },
  ProjectNotFoundError | ComponentNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const component = yield* findComponentByIdOrLabel(client, project._id, params.component)

    if (component === undefined) {
      return yield* new ComponentNotFoundError({
        identifier: params.component,
        project: params.project
      })
    }

    return { client, project, component }
  })

export const listComponents = (
  params: ListComponentsParams
): Effect.Effect<Array<ComponentSummary>, ListComponentsError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const limit = Math.min(params.limit ?? 50, 200)

    const components = yield* client.findAll<HulyComponent>(
      tracker.class.Component,
      { space: project._id },
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    const leadIds = [
      ...new Set(
        components.map(c => c.lead).filter(isExistent)
      )
    ]

    const persons = leadIds.length > 0
      ? yield* client.findAll<Person>(
        contact.class.Person,
        { _id: { $in: leadIds } }
      )
      : []

    const personMap = new Map(persons.map(p => [p._id, p]))

    const summaries: Array<ComponentSummary> = components.map(c => {
      const leadName = c.lead !== null ? personMap.get(c.lead)?.name : undefined
      return {
        id: ComponentId.make(c._id),
        label: ComponentLabel.make(c.label),
        lead: leadName !== undefined ? PersonName.make(leadName) : undefined,
        modifiedOn: c.modifiedOn
      }
    })

    return summaries
  })

export const getComponent = (
  params: GetComponentParams
): Effect.Effect<Component, GetComponentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, component } = yield* findProjectAndComponent(params)

    const leadName = component.lead !== null
      ? (yield* client.findOne<Person>(contact.class.Person, { _id: component.lead }))?.name
      : undefined

    const result: Component = {
      id: ComponentId.make(component._id),
      label: ComponentLabel.make(component.label),
      description: component.description,
      lead: leadName !== undefined ? PersonName.make(leadName) : undefined,
      project: params.project,
      modifiedOn: component.modifiedOn,
      createdOn: component.createdOn
    }

    return result
  })

export const createComponent = (
  params: CreateComponentParams
): Effect.Effect<CreateComponentResult, CreateComponentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, project } = yield* findProject(params.project)

    const componentId: Ref<HulyComponent> = generateId()

    const leadParam = params.lead
    const leadRef: Ref<Employee> | null = leadParam !== undefined
      ? yield* Effect.gen(function*() {
        const person = yield* findPersonByEmailOrName(client, leadParam)
        if (person === undefined) {
          return yield* new PersonNotFoundError({ identifier: leadParam })
        }
        // Huly API: Component.lead expects Ref<Employee>, but we look up Person by email.
        // Employee extends Person, so this is safe when person is actually an employee.
        return toRef<Employee>(person._id)
      })
      : null

    const componentData: Data<HulyComponent> = {
      label: params.label,
      description: params.description ?? "",
      lead: leadRef,
      comments: 0
    }

    yield* client.createDoc(
      tracker.class.Component,
      project._id,
      componentData,
      componentId
    )

    return { id: ComponentId.make(componentId), label: ComponentLabel.make(params.label) }
  })

export const updateComponent = (
  params: UpdateComponentParams
): Effect.Effect<UpdateComponentResult, UpdateComponentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, component, project } = yield* findProjectAndComponent(params)

    const updateOps: DocumentUpdate<HulyComponent> = {}

    if (params.label !== undefined) {
      updateOps.label = params.label
    }

    if (params.description !== undefined) {
      updateOps.description = params.description
    }

    if (params.lead !== undefined) {
      if (params.lead === null) {
        updateOps.lead = null
      } else {
        const person = yield* findPersonByEmailOrName(client, params.lead)
        if (person === undefined) {
          return yield* new PersonNotFoundError({ identifier: params.lead })
        }
        // Huly API: Component.lead expects Ref<Employee>, but we look up Person by email.
        // Employee extends Person, so this is safe when person is actually an employee.
        updateOps.lead = toRef<Employee>(person._id)
      }
    }

    if (Object.keys(updateOps).length === 0) {
      return { id: ComponentId.make(component._id), updated: false }
    }

    yield* client.updateDoc(
      tracker.class.Component,
      project._id,
      component._id,
      updateOps
    )

    return { id: ComponentId.make(component._id), updated: true }
  })

export const setIssueComponent = (
  params: SetIssueComponentParams
): Effect.Effect<SetIssueComponentResult, SetIssueComponentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue, project } = yield* findProjectAndIssue(params)

    const componentParam = params.component
    const componentRef: Ref<HulyComponent> | null = componentParam !== null
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

    yield* client.updateDoc(
      tracker.class.Issue,
      project._id,
      issue._id,
      { component: componentRef }
    )

    return { identifier: IssueIdentifier.make(issue.identifier), componentSet: true }
  })

export const deleteComponent = (
  params: DeleteComponentParams
): Effect.Effect<DeleteComponentResult, DeleteComponentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, component, project } = yield* findProjectAndComponent(params)

    yield* client.removeDoc(
      tracker.class.Component,
      project._id,
      component._id
    )

    return { id: ComponentId.make(component._id), deleted: true }
  })
