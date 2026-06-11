import { AbstractFieldType } from './AbstractFieldType.js'

export class TreeFieldType extends AbstractFieldType {
  getName() { return 'tree' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
  override formatDefaultValue(value: unknown): unknown {
    return Array.isArray(value) ? value : []
  }
}
