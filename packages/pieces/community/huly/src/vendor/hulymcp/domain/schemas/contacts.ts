import { JSONSchema, Schema } from "effect"

import type { ContactProvider, OrganizationId, PersonName } from "./shared.js"
import { Email, LimitParam, MemberReference, NonEmptyString, PersonId } from "./shared.js"

// No codec needed — internal type, not used for runtime validation
export interface PersonSummary {
  readonly id: PersonId
  readonly name: PersonName
  readonly city?: string | undefined
  readonly email?: Email | undefined
  readonly modifiedOn?: number | undefined
}

export interface Person {
  readonly id: PersonId
  readonly name: PersonName
  readonly firstName?: string | undefined
  readonly lastName?: string | undefined
  readonly city?: string | undefined
  readonly email?: Email | undefined
  readonly channels?: ReadonlyArray<{ readonly provider: ContactProvider; readonly value: string }> | undefined
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export interface EmployeeSummary {
  readonly id: PersonId
  readonly name: PersonName
  readonly email?: Email | undefined
  readonly position?: string | undefined
  readonly active: boolean
  readonly modifiedOn?: number | undefined
}

export interface OrganizationSummary {
  readonly id: OrganizationId
  readonly name: string
  readonly city?: string | undefined
  readonly members: number
  readonly modifiedOn?: number | undefined
}

const ListPersonsParamsBase = Schema.Struct({
  nameSearch: Schema.optional(Schema.String.annotations({
    description: "Search persons by name substring (case-insensitive). Mutually exclusive with nameRegex."
  })),
  nameRegex: Schema.optional(Schema.String.annotations({
    description:
      "Filter persons by name using a regex pattern (e.g., '^Smith'). Mutually exclusive with nameSearch. Note: regex support depends on the Huly backend; use nameSearch for broader compatibility."
  })),
  emailSearch: Schema.optional(Schema.String.annotations({
    description: "Search persons by email substring (case-insensitive)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of persons to return (default: 50)"
    })
  )
})

export const ListPersonsParamsSchema = ListPersonsParamsBase.pipe(
  Schema.filter((params) => {
    if (params.nameSearch !== undefined && params.nameRegex !== undefined) {
      return "Cannot provide both 'nameSearch' and 'nameRegex'. Use one or the other."
    }
    return undefined
  })
).annotations({
  title: "ListPersonsParams",
  description: "Parameters for listing persons"
})

export type ListPersonsParams = Schema.Schema.Type<typeof ListPersonsParamsSchema>

const GetPersonByIdSchema = Schema.Struct({
  personId: PersonId.annotations({
    description: "Person ID"
  })
}).annotations({
  title: "GetPersonById",
  description: "Get person by ID"
})

const GetPersonByEmailSchema = Schema.Struct({
  email: Email.annotations({
    description: "Person email address"
  })
}).annotations({
  title: "GetPersonByEmail",
  description: "Get person by email"
})

export const GetPersonParamsSchema = Schema.Union(
  GetPersonByIdSchema,
  GetPersonByEmailSchema
).annotations({
  title: "GetPersonParams",
  description: "Parameters for getting a single person (provide personId or email)"
})

export type GetPersonParams = Schema.Schema.Type<typeof GetPersonParamsSchema>

export const CreatePersonParamsSchema = Schema.Struct({
  firstName: NonEmptyString.annotations({
    description: "First name"
  }),
  lastName: NonEmptyString.annotations({
    description: "Last name"
  }),
  email: Schema.optional(Email.annotations({
    description: "Email address"
  })),
  city: Schema.optional(Schema.String.annotations({
    description: "City"
  }))
}).annotations({
  title: "CreatePersonParams",
  description: "Parameters for creating a person"
})

export type CreatePersonParams = Schema.Schema.Type<typeof CreatePersonParamsSchema>

export const UpdatePersonParamsSchema = Schema.Struct({
  personId: PersonId.annotations({
    description: "Person ID"
  }),
  firstName: Schema.optional(NonEmptyString.annotations({
    description: "New first name"
  })),
  lastName: Schema.optional(NonEmptyString.annotations({
    description: "New last name"
  })),
  city: Schema.optional(
    Schema.NullOr(Schema.String).annotations({
      description: "New city (null to clear)"
    })
  )
}).annotations({
  title: "UpdatePersonParams",
  description: "Parameters for updating a person"
})

export type UpdatePersonParams = Schema.Schema.Type<typeof UpdatePersonParamsSchema>

export const DeletePersonParamsSchema = Schema.Struct({
  personId: PersonId.annotations({
    description: "Person ID"
  })
}).annotations({
  title: "DeletePersonParams",
  description: "Parameters for deleting a person"
})

export type DeletePersonParams = Schema.Schema.Type<typeof DeletePersonParamsSchema>

export const ListEmployeesParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of employees to return (default: 50)"
    })
  )
}).annotations({
  title: "ListEmployeesParams",
  description: "Parameters for listing employees"
})

export type ListEmployeesParams = Schema.Schema.Type<typeof ListEmployeesParamsSchema>

export const ListOrganizationsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of organizations to return (default: 50)"
    })
  )
}).annotations({
  title: "ListOrganizationsParams",
  description: "Parameters for listing organizations"
})

export type ListOrganizationsParams = Schema.Schema.Type<typeof ListOrganizationsParamsSchema>

export const CreateOrganizationParamsSchema = Schema.Struct({
  name: NonEmptyString.annotations({
    description: "Organization name"
  }),
  members: Schema.optional(
    Schema.Array(MemberReference).annotations({
      description: "Member person IDs or emails"
    })
  )
}).annotations({
  title: "CreateOrganizationParams",
  description: "Parameters for creating an organization"
})

export type CreateOrganizationParams = Schema.Schema.Type<typeof CreateOrganizationParamsSchema>

export const listPersonsParamsJsonSchema = JSONSchema.make(ListPersonsParamsSchema)
export const getPersonParamsJsonSchema = JSONSchema.make(GetPersonParamsSchema)
export const createPersonParamsJsonSchema = JSONSchema.make(CreatePersonParamsSchema)
export const updatePersonParamsJsonSchema = JSONSchema.make(UpdatePersonParamsSchema)
export const deletePersonParamsJsonSchema = JSONSchema.make(DeletePersonParamsSchema)
export const listEmployeesParamsJsonSchema = JSONSchema.make(ListEmployeesParamsSchema)
export const listOrganizationsParamsJsonSchema = JSONSchema.make(ListOrganizationsParamsSchema)
export const createOrganizationParamsJsonSchema = JSONSchema.make(CreateOrganizationParamsSchema)

export const parseListPersonsParams = Schema.decodeUnknown(ListPersonsParamsSchema)
export const parseGetPersonParams = Schema.decodeUnknown(GetPersonParamsSchema)
export const parseCreatePersonParams = Schema.decodeUnknown(CreatePersonParamsSchema)
export const parseUpdatePersonParams = Schema.decodeUnknown(UpdatePersonParamsSchema)
export const parseDeletePersonParams = Schema.decodeUnknown(DeletePersonParamsSchema)
export const parseListEmployeesParams = Schema.decodeUnknown(ListEmployeesParamsSchema)
export const parseListOrganizationsParams = Schema.decodeUnknown(ListOrganizationsParamsSchema)
export const parseCreateOrganizationParams = Schema.decodeUnknown(CreateOrganizationParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface CreatePersonResult {
  readonly id: PersonId
}

export interface UpdatePersonResult {
  readonly id: PersonId
  readonly updated: boolean
}

export interface DeletePersonResult {
  readonly id: PersonId
  readonly deleted: boolean
}

export interface CreateOrganizationResult {
  readonly id: OrganizationId
}
