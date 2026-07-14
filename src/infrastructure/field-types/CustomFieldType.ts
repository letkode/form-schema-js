import { AbstractFieldType } from './AbstractFieldType.js'

/**
 * Generic, business-logic-free field type for project-defined custom widgets.
 * The consuming app dispatches on `field.parameters.key` (meaningless to this
 * package) to pick its own React (or other framework) component — see
 * "One 'custom' type instead of one type per widget" in the README.
 */
export class CustomFieldType extends AbstractFieldType {
  getName() { return 'custom' as const }
  takesOptions() { return true }
  getDefaultParameters() {
    return {}
  }
}
