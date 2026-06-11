import { AbstractFieldType } from './AbstractFieldType.js'

export class TextareaFieldType extends AbstractFieldType {
  getName() { return 'textarea' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', rows: 4, max_length: null, min_length: null }
  }
}
