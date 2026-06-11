import { AbstractFieldType } from './AbstractFieldType.js'

export class SelectFieldType extends AbstractFieldType {
  getName() { return 'select' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default' }
  }
}
