import { AbstractFieldType } from './AbstractFieldType.js'

export class EmailFieldType extends AbstractFieldType {
  getName() { return 'email' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', max_length: 254 }
  }
}
