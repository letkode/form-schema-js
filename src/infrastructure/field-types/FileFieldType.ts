import { AbstractFieldType } from './AbstractFieldType.js'

export class FileFieldType extends AbstractFieldType {
  getName() { return 'file' as const }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', accept: null, multiple: false }
  }
}
