import { AbstractFieldType } from './AbstractFieldType.js'

export class HiddenFieldType extends AbstractFieldType {
  getName() { return 'hidden' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'hidden' }
  }
}
