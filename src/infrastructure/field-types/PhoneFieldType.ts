import { AbstractFieldType } from './AbstractFieldType.js'

export class PhoneFieldType extends AbstractFieldType {
  getName() { return 'phone' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', max_length: 20 }
  }
}
