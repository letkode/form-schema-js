import { AbstractFieldType } from './AbstractFieldType.js'

export class CollectorFieldType extends AbstractFieldType {
  getName() { return 'collector' as const }
  takesOptions() { return false }
  getDefaultParameters(): Record<string, unknown> {
    return { layout: 'vertical', add_label: 'Add item', fields: [] }
  }
}
