import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padNumber',
  standalone: true
})
export class PadNumberPipe implements PipeTransform {
  transform(value: number | string, length: number = 4): string {
    if (value === null || value === undefined || value === '') return '';
    
    const stringValue = value.toString();
    const zerosNeeded = Math.max(0, length - stringValue.length);
    
    return '0'.repeat(zerosNeeded) + stringValue;
  }
}
