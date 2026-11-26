import { bindRoutingEvents } from './portal/router';
import { updateCalculator, bindCalculatorEvents } from './portal/calculator';
import { syncCalculatorUI } from './portal/calculator-events';
import { bindManuscriptEvents } from './portal/manuscript';
import { bindOrderEvents } from './portal/orders';
import { bindAuthEvents, restoreSession } from './portal/auth-gate';
import { bindTestimonialEvents } from './portal/testimonials';

/**
 * Master Portal Controller Orchestrator
 * High-level coordinator initializing modular subsystems (DRY & Modularity principle).
 */
export function initPortalController() {
  bindRoutingEvents();
  bindCalculatorEvents();
  bindManuscriptEvents();
  bindOrderEvents();
  bindAuthEvents();
  bindTestimonialEvents();

  restoreSession();
  syncCalculatorUI();
  updateCalculator();
}
