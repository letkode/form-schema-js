import { AbstractFieldType } from './AbstractFieldType.js'

export class CollectorFieldType extends AbstractFieldType {
  getName() { return 'collector' as const }
  takesOptions() { return false }
  getDefaultParameters(): Record<string, unknown> {
    return { layout: 'horizontal', add_label: 'Add item', min_items: null, max_items: null, fields: [] }
  }
}
