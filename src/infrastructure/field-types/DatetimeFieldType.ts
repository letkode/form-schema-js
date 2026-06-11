import { AbstractFieldType } from './AbstractFieldType.js'

export class DatetimeFieldType extends AbstractFieldType {
  getName() { return 'datetime' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
}
