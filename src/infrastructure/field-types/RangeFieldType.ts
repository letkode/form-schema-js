import { AbstractFieldType } from './AbstractFieldType.js'

export class RangeFieldType extends AbstractFieldType {
  getName() { return 'range' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', min: 0, max: 100, step: 1 }
  }
  override formatDefaultValue(value: unknown): unknown {
    if (value === null || value === undefined) return 0
    const n = Number(value)
    return isNaN(n) ? 0 : n
  }
}
