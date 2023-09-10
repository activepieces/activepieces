import { Pipe, PipeTransform } from '@angular/core';
import { DataSource } from '@activepieces/shared';

@Pipe({
  name: 'dataSourceUrlExtractor',
})
export class DataSourceUrlExtractorPipe implements PipeTransform {
  transform(value: DataSource): string {
    return value.props['url'] as string;
  }
}
