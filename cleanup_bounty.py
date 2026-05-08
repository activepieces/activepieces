import os

def cleanup_piece_metadata_controller():
    path = 'packages/server/api/src/app/pieces/metadata/piece-metadata-controller.ts'
    content = open(path, encoding='utf-8').read()
    
    # 1. Remove imports
    content = content.replace("    ListPieceVersionsRequestParams,\n", "")
    content = content.replace("    ListPieceVersionsWithScopeRequestParams,\n", "")
    
    # 2. Remove unused request objects
    unused_objects = [
        "const ListPieceVersionsRequest = {\n    config: {\n        security: securityAccess.project([PrincipalType.USER], undefined, {\n            type: ProjectResourceType.QUERY,\n        }),\n    },\n    schema: {\n        params: ListPieceVersionsRequestParams,\n    },\n}\n\n",
        "const ListPieceVersionsWithScopeRequest = {\n    config: {\n        security: securityAccess.project([PrincipalType.USER], undefined, {\n            type: ProjectResourceType.QUERY,\n        }),\n    },\n    schema: {\n        params: ListPieceVersionsWithScopeRequestParams,\n    },\n}\n\n"
    ]
    for obj in unused_objects:
        content = content.replace(obj, "")
        
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print("Cleaned piece-metadata-controller.ts")

def cleanup_piece_requests():
    path = 'packages/shared/src/lib/automation/pieces/dto/piece-requests.ts'
    content = open(path, encoding='utf-8').read()
    
    # Remove unused schemas and types
    unused_blocks = [
        "export const ListPieceVersionsRequestParams = z.object({\n    name: z.string(),\n})\n",
        "export const ListPieceVersionsWithScopeRequestParams = z.object({\n    name: z.string(),\n    scope: z.string(),\n})\n",
        "export type ListPieceVersionsWithScopeRequestParams = z.infer<typeof ListPieceVersionsWithScopeRequestParams>\n\n",
        "export type ListPieceVersionsRequestParams = z.infer<typeof ListPieceVersionsRequestParams>\n\n",
        "export const ListPieceVersionsResponse = z.object({ version: z.string() })\n",
        "export type ListPieceVersionsResponse = SeekPage<z.infer<typeof ListPieceVersionsResponse>>\n\n"
    ]
    for block in unused_blocks:
        content = content.replace(block, "")
        
    # Also remove SeekPage import if no longer used (it was added in this PR)
    if "SeekPage" in content and "ListPieceVersionsResponse" not in content:
        content = content.replace("import { SeekPage } from '../../../core/common/seek-page'\n", "")

    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print("Cleaned piece-requests.ts")

if __name__ == "__main__":
    cleanup_piece_metadata_controller()
    cleanup_piece_requests()
