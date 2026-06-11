export { AbstractFieldType } from './AbstractFieldType.js'
export type { FieldTypeDefinition } from './AbstractFieldType.js'

export { StringFieldType } from './StringFieldType.js'
export { EmailFieldType } from './EmailFieldType.js'
export { PhoneFieldType } from './PhoneFieldType.js'
export { PasswordFieldType } from './PasswordFieldType.js'
export { HiddenFieldType } from './HiddenFieldType.js'
export { PinFieldType } from './PinFieldType.js'
export { TextareaFieldType } from './TextareaFieldType.js'
export { NumberFieldType } from './NumberFieldType.js'
export { RangeFieldType } from './RangeFieldType.js'
export { DateFieldType } from './DateFieldType.js'
export { DatetimeFieldType } from './DatetimeFieldType.js'
export { DateRangeFieldType } from './DateRangeFieldType.js'
export { SelectFieldType } from './SelectFieldType.js'
export { SelectMultipleFieldType } from './SelectMultipleFieldType.js'
export { ComboboxFieldType } from './ComboboxFieldType.js'
export { RadioFieldType } from './RadioFieldType.js'
export { CheckboxFieldType } from './CheckboxFieldType.js'
export { SwitchFieldType } from './SwitchFieldType.js'
export { DuallistFieldType } from './DuallistFieldType.js'
export { TreeFieldType } from './TreeFieldType.js'
export { RatingFieldType } from './RatingFieldType.js'
export { FileFieldType } from './FileFieldType.js'

import { StringFieldType } from './StringFieldType.js'
import { EmailFieldType } from './EmailFieldType.js'
import { PhoneFieldType } from './PhoneFieldType.js'
import { PasswordFieldType } from './PasswordFieldType.js'
import { HiddenFieldType } from './HiddenFieldType.js'
import { PinFieldType } from './PinFieldType.js'
import { TextareaFieldType } from './TextareaFieldType.js'
import { NumberFieldType } from './NumberFieldType.js'
import { RangeFieldType } from './RangeFieldType.js'
import { DateFieldType } from './DateFieldType.js'
import { DatetimeFieldType } from './DatetimeFieldType.js'
import { DateRangeFieldType } from './DateRangeFieldType.js'
import { SelectFieldType } from './SelectFieldType.js'
import { SelectMultipleFieldType } from './SelectMultipleFieldType.js'
import { ComboboxFieldType } from './ComboboxFieldType.js'
import { RadioFieldType } from './RadioFieldType.js'
import { CheckboxFieldType } from './CheckboxFieldType.js'
import { SwitchFieldType } from './SwitchFieldType.js'
import { DuallistFieldType } from './DuallistFieldType.js'
import { TreeFieldType } from './TreeFieldType.js'
import { RatingFieldType } from './RatingFieldType.js'
import { FileFieldType } from './FileFieldType.js'
import type { FieldTypeDefinition } from './AbstractFieldType.js'

export const ALL_FIELD_TYPES: FieldTypeDefinition[] = [
  new StringFieldType(),
  new EmailFieldType(),
  new PhoneFieldType(),
  new PasswordFieldType(),
  new HiddenFieldType(),
  new PinFieldType(),
  new TextareaFieldType(),
  new NumberFieldType(),
  new RangeFieldType(),
  new DateFieldType(),
  new DatetimeFieldType(),
  new DateRangeFieldType(),
  new SelectFieldType(),
  new SelectMultipleFieldType(),
  new ComboboxFieldType(),
  new RadioFieldType(),
  new CheckboxFieldType(),
  new SwitchFieldType(),
  new DuallistFieldType(),
  new TreeFieldType(),
  new RatingFieldType(),
  new FileFieldType(),
]
