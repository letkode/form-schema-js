import { AbstractFieldType } from './AbstractFieldType.js'

export class PasswordFieldType extends AbstractFieldType {
  getName() { return 'password' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', min_length: 8, max_length: null }
  }
}
