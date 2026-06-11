import { AbstractFieldType } from './AbstractFieldType.js'

export class ComboboxFieldType extends AbstractFieldType {
  getName() { return 'combobox' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return { label_style: 'default', searchable: true, api_url: null }
  }
}
