import { AbstractFieldType } from './AbstractFieldType.js'

export class DuallistFieldType extends AbstractFieldType {
  getName() { return 'duallist' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default', max_count_items: null }
  }
  override formatDefaultValue(value: unknown): unknown {
    return Array.isArray(value) ? value : []
  }
}
