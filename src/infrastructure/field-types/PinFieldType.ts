import { AbstractFieldType } from './AbstractFieldType.js'

export class PinFieldType extends AbstractFieldType {
  getName() { return 'pin' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', length: 4 }
  }
}
