export { DefaultSectionRender } from './DefaultSectionRender.js'
export { AccordionSectionRender } from './AccordionSectionRender.js'
export { CollapsibleSectionRender } from './CollapsibleSectionRender.js'
export { TabsSectionRender } from './TabsSectionRender.js'

import { DefaultSectionRender } from './DefaultSectionRender.js'
import { AccordionSectionRender } from './AccordionSectionRender.js'
import { CollapsibleSectionRender } from './CollapsibleSectionRender.js'
import { TabsSectionRender } from './TabsSectionRender.js'
import type { RenderDefinition } from '../RenderDefinition.js'

export const ALL_SECTION_RENDERS: RenderDefinition[] = [
  new DefaultSectionRender(),
  new AccordionSectionRender(),
  new CollapsibleSectionRender(),
  new TabsSectionRender(),
]
