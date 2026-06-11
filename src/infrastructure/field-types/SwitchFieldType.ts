import { AbstractFieldType } from './AbstractFieldType.js'

export class SwitchFieldType extends AbstractFieldType {
  getName() { return 'switch' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
  override formatDefaultValue(value: unknown): unknown {
    return value === true || value === 'true' || value === 1
  }
}
