import { AbstractFieldType } from './AbstractFieldType.js'

export class CheckboxFieldType extends AbstractFieldType {
  getName() { return 'checkbox' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default', layout: 'vertical' }
  }
  override formatDefaultValue(value: unknown): unknown {
    return Array.isArray(value) ? value : (value ? [value] : [])
  }
}
