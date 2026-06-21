# POST for all mutations, DELETE for deletes — never PUT/PATCH

All create and update mutations use `POST`; deletes use `DELETE`. We deliberately do not use `PUT` or `PATCH`. A single mutation verb keeps controllers, client SDKs, and the discriminated-union operation bodies (see [ADR-0007](./0007-flow-single-endpoint-operations.md)) uniform, and avoids per-endpoint debate about partial-vs-full update semantics. A future reader expecting REST conventions will otherwise wonder why update endpoints are not `PUT`.
