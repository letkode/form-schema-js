import { AbstractFieldType } from './AbstractFieldType.js'

export class RadioFieldType extends AbstractFieldType {
  getName() { return 'radio' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default', layout: 'vertical' }
  }
}
