import { AbstractFieldType } from './AbstractFieldType.js'

export class DateRangeFieldType extends AbstractFieldType {
  getName() { return 'date-range' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
  override formatDefaultValue(value: unknown): unknown {
    return value ?? { from: null, to: null }
  }
}
