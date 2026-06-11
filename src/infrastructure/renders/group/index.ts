export { DefaultGroupRender } from './DefaultGroupRender.js'
export { FieldsetGroupRender } from './FieldsetGroupRender.js'
export { MatrixGroupRender } from './MatrixGroupRender.js'

import { DefaultGroupRender } from './DefaultGroupRender.js'
import { FieldsetGroupRender } from './FieldsetGroupRender.js'
import { MatrixGroupRender } from './MatrixGroupRender.js'
import type { RenderDefinition } from '../RenderDefinition.js'

export const ALL_GROUP_RENDERS: RenderDefinition[] = [
  new DefaultGroupRender(),
  new FieldsetGroupRender(),
  new MatrixGroupRender(),
]
