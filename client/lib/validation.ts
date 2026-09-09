import { NotFoundError, ValidationError } from '@/lib/errors';

/**
 * Parse a route param into a valid restaurant id.
 *
 * The contract treats any id that isn't a positive integer (`abc`, `-1`,
 * `1.5`) as a 404, not a 400 - there's no such restaurant.
 */
export function parseId(raw: string): number {
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new NotFoundError('Restaurant not found');
  }

  return id;
}

export interface RestaurantInput {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
}

/**
 * Validate a POST/PUT request body against the `restaurants` schema.
 * `name` is required (NOT NULL in the DB); `cuisine`, `address`, and `rating`
 * are nullable columns, so they're optional but must be the right type when
 * present.
 */
export function validateRestaurantBody(body: unknown): RestaurantInput {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const { name, cuisine, address, rating } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('name is required and must be a non-empty string');
  }

  if (cuisine !== undefined && cuisine !== null && typeof cuisine !== 'string') {
    throw new ValidationError('cuisine must be a string');
  }

  if (address !== undefined && address !== null && typeof address !== 'string') {
    throw new ValidationError('address must be a string');
  }

  if (
    rating !== undefined &&
    rating !== null &&
    (typeof rating !== 'number' || Number.isNaN(rating) || rating < 0 || rating > 5)
  ) {
    throw new ValidationError('rating must be a number between 0 and 5');
  }

  return {
    name,
    cuisine: (cuisine as string | null | undefined) ?? null,
    address: (address as string | null | undefined) ?? null,
    rating: (rating as number | null | undefined) ?? null,
  };
}
