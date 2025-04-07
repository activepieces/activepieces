import { apId } from "../common/id-generator";
import { Cell } from "./cell";
import { Field } from "./field";
import { PopulatedRecord } from "./record";


const constructEmptyRow = ({tableId,projectId}:{tableId: string,projectId: string}): PopulatedRecord =>{
  return {
    cells: [],
    created: '',
    id: '',
    projectId,
    tableId,
    updated: '',
  }
}
export const tableUtils = {
  getRecordsFromFields({
    fields,
    recordsIds,
    projectId,
    tableId,
  }: {
    fields: Field[];
    recordsIds: string[] | 'ALL';
    projectId: string;
    tableId: string;
  }): PopulatedRecord[] {
      const existingRecordIndexes = recordsIds === 'ALL' ?  Array.from({length: fields[0].cells.length},(_,index)=>index) : recordsIds.filter(id=> fields[0].cells.findIndex((c)=> c.recordId === id) >-1);
      return existingRecordIndexes.reduce((records,recordId)=>{
        const row = fields.reduce((rw,field)=>{
            const cell = field.cells.find((c)=>c.recordId === recordId)
            if(cell){
                rw.cells.push({
                    created: cell.created,
                    updated: cell.updated,
                    value: cell.value,
                    fieldId: field.id,
                    recordId: recordId.toString(),
                    projectId,
                })
            }
           return rw
        },constructEmptyRow({tableId,projectId}))
        row.created = findOldestCell(row).created
        row.updated = findMostRecentlyUpdatedCell(row).updated
        records.push(row)
        return records
      },[] as PopulatedRecord[])   
  },
  addValuesToFields({
    fields,
    records,
  }: {
    fields: Field[];
    records: {fieldId:string,value:string}[][];
  }): Field[] {
    const recordsIds = Array.from({length: records.length},()=>apId())
     const updatedFields = fields.map((field)=>{
        const cells= records.reduce<Cell[]>((acc,record,index)=>{
             const cell = record.find((r)=>r.fieldId === field.id)
             if(cell){
                acc.push({
                    fieldId: field.id,
                    projectId: field.projectId,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    value: cell.value,
                    recordId: recordsIds[index],
                })
             }
             return acc
        },[])
        return {
            ...field,
            cells,
        }
     })
     return updatedFields
},
updateRecord({
    fields,
    cells,
    id
}:{
    fields: Field[];
    cells: {fieldId:string,value:string}[];
    id: string
}): Field[] {
    const updatedFields:Field[] = fields.map((field)=>{
        const updatedCells = field.cells.map((cell)=>{
            if(cell.recordId === id){
                const cellValue = cells.find((c)=>c.fieldId === field.id)?.value
                if(cellValue){
                    return {
                        ...cell,
                        value: cellValue,
                        updated: new Date().toISOString(),
                    }
                }
            }
            return cell
        }).filter((c)=>c !== undefined)
        return {
            ...field,
            cells: updatedCells
        }
    })
    return updatedFields
}
}

function findOldestCell(row: PopulatedRecord) {
    return row.cells.reduce((acc, cell) => {
        if (new Date(cell.created) < new Date(acc.created)) {
            return cell;
        }
        return acc;
    }, row.cells[0]);
}

function findMostRecentlyUpdatedCell(row: PopulatedRecord) {
    return row.cells.reduce((acc, cell) => {
        if (new Date(cell.updated) > new Date(acc.updated)) {
            return cell;
        }
        return acc
    }, row.cells[0])
}