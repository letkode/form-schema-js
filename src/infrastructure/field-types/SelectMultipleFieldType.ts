import { AbstractFieldType } from './AbstractFieldType.js'

export class SelectMultipleFieldType extends AbstractFieldType {
  getName() { return 'select-multiple' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
  override formatDefaultValue(value: unknown): unknown {
    return Array.isArray(value) ? value : (value ? [value] : [])
  }
}
