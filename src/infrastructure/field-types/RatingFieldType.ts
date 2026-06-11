import { AbstractFieldType } from './AbstractFieldType.js'

export class RatingFieldType extends AbstractFieldType {
  getName() { return 'rating' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', max: 5 }
  }
  override formatDefaultValue(value: unknown): unknown {
    const n = Number(value)
    return isNaN(n) ? null : n
  }
}
