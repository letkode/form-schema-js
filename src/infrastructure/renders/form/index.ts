export { DefaultFormRender } from './DefaultFormRender.js'
export { StepperFormRender } from './StepperFormRender.js'
export { WizardFormRender } from './WizardFormRender.js'
export { TabsFormRender } from './TabsFormRender.js'

import { DefaultFormRender } from './DefaultFormRender.js'
import { StepperFormRender } from './StepperFormRender.js'
import { WizardFormRender } from './WizardFormRender.js'
import { TabsFormRender } from './TabsFormRender.js'
import type { RenderDefinition } from '../RenderDefinition.js'

export const ALL_FORM_RENDERS: RenderDefinition[] = [
  new DefaultFormRender(),
  new StepperFormRender(),
  new WizardFormRender(),
  new TabsFormRender(),
]
