import { AbstractFieldType } from './AbstractFieldType.js'

export class StringFieldType extends AbstractFieldType {
  getName() { return 'string' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', max_length: 255, min_length: null }
  }
}
