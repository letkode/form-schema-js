import { AbstractFieldType } from './AbstractFieldType.js'

export class DateFieldType extends AbstractFieldType {
  getName() { return 'date' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
}
