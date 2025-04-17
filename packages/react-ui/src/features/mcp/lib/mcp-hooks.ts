import { useQuery } from "@tanstack/react-query";
import { mcpApi } from "./mcp-api";


export const mcpHooks = {
    useMcp: () => {
    return useQuery({
            queryKey: ['mcp'],
            queryFn: () => {
              return mcpApi.get();
            },
          });
    }
}