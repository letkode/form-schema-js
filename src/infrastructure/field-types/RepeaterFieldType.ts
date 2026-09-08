import { AbstractFieldType } from './AbstractFieldType.js'

/**
 * Repeats a **single** field definition N times. Same idea as `collector`, but
 * where `collector` repeats a *group* of sub-fields (each row is an object keyed
 * by sub-field tag), `repeater` repeats *one* field (`parameters.field`, a
 * `RawField`) and its value is a **flat array of that field's values**
 * (e.g. `["uuid-a", "uuid-b"]`).
 *
 * `parameters.field` is resolved recursively into a full `FormField` at resolve
 * time, exactly like `collector`'s `parameters.fields`. The consuming renderer
 * owns the add/remove row UI and dispatches on `parameters.field.type` for the
 * per-row control.
 */
export class RepeaterFieldType extends AbstractFieldType {
  getName() { return 'repeater' as const }
  takesOptions() { return false }
  getDefaultParameters(): Record<string, unknown> {
    return { add_label: 'Add item', min_items: null, max_items: null, field: null }
  }
  override formatDefaultValue(value: unknown): unknown {
    return Array.isArray(value) ? value : []
  }
}
