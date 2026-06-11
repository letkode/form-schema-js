import { AbstractFieldType } from './AbstractFieldType.js'

export class NumberFieldType extends AbstractFieldType {
  getName() { return 'number' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', min: null, max: null, step: 1 }
  }
  override formatDefaultValue(value: unknown): unknown {
    if (value === null || value === undefined) return null
    const n = Number(value)
    return isNaN(n) ? null : n
  }
}
