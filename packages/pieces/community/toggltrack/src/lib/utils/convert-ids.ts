export function convertIdsToInt(props: any): any {
  const fieldsToConvert = [
    'workspaceId', 
    'projectId', 
    'clientId', 
    'taskId', 
    'organizationId', 
    'tagId', 
    'timeEntryId'
  ];
  
  const convertedProps = { ...props };
  
  for (const field of fieldsToConvert) {
    if (field in convertedProps && typeof convertedProps[field] === 'string') {
      convertedProps[field] = parseInt(convertedProps[field], 10);
    }
  }
  
  return convertedProps;
}
