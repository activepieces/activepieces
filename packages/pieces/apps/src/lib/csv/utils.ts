import { parse, ParseResult } from "papaparse"

export const parseCSVFile = (csvFile: string, config: Record<string, unknown>) => 
  new Promise((complete, error) => {
    parse(csvFile, {
      ...config,
      complete: (results: ParseResult<Record<string, unknown>>) => {
        console.debug("csv results received", results)
        complete(results.data)
      },
      error
    })
  })