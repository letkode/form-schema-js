export interface InteractionHandlerDefinition {
  getName(): string
}

class SimpleInteractionHandler implements InteractionHandlerDefinition {
  constructor(private readonly name: string) {}
  getName() { return this.name }
}

export const ALL_INTERACTION_HANDLERS: InteractionHandlerDefinition[] = [
  new SimpleInteractionHandler('toggle_visibility'),
  new SimpleInteractionHandler('toggle_required'),
  new SimpleInteractionHandler('set_value'),
  new SimpleInteractionHandler('filter_options'),
  new SimpleInteractionHandler('set_date_constraint'),
  new SimpleInteractionHandler('compute'),
  new SimpleInteractionHandler('ajax_validate'),
]
