import { AbstractRender } from '../RenderDefinition.js'

/**
 * Generic section render for project-defined custom sections (e.g. a
 * read-only review/summary step). The consuming app dispatches on
 * `render.metadata.key` to pick its own component.
 */
export class CustomSectionRender extends AbstractRender {
  getName() { return 'custom' }
}
