# Oracle Fusion Cloud ERP Piece

Minimal piece providing generic CRUD, search and a polling trigger over Oracle Fusion Cloud ERP REST resources.

## Authentication
- Base URL (e.g. `https://yourdomain.fa.oraclecloud.com`)
- Username
- Password

Validation performs a small GET on a public resource endpoint to confirm connectivity.

## Actions
- Create Record: POST to `/fscmRestApi/resources/11.13.18.05/{objectPath}`
- Update Record: PATCH `/fscmRestApi/resources/11.13.18.05/{objectPath}/{id}`
- Delete Record: DELETE `/fscmRestApi/resources/11.13.18.05/{objectPath}/{id}`
- Get Record: GET `/fscmRestApi/resources/11.13.18.05/{objectPath}/{id}`
- Search Records: GET `/fscmRestApi/resources/11.13.18.05/{objectPath}` with `q`, `limit`, `offset`

## Trigger
- New Record (polling): queries by a user-provided timestamp field (e.g. `CreationDate`) greater than the last stored timestamp.

## Notes
- `objectPath` is not validated; users should provide the correct object collection path (e.g. `invoices`, `purchaseOrders`).
- Query syntax (`q`) depends on the selected object; consult Oracle documentation.

## Testing
Use an Oracle Fusion Cloud ERP test tenant. Provide minimal payloads based on the selected object. Verify auth, create, then get or search.
