/**
 * Money helpers.
 *
 * Clover represents all amounts in the smallest currency unit (cents for USD),
 * e.g. $20.99 -> 2099. The frontend works in dollars, so we convert at the
 * boundary and keep cents everywhere internally.
 */

/** Convert a dollar amount to integer cents. $25.50 -> 2550. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to a dollar amount. 2550 -> 25.5. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
