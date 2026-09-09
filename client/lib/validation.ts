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

export interface VisitInput {
  date: string;
  amountSpent: number | null;
  notes: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a POST/PUT request body against the `visits` schema. `date` is
 * required (NOT NULL in the DB); `amountSpent` and `notes` are nullable
 * columns, so they're optional but must be the right shape when present.
 */
export function validateVisitBody(body: unknown): VisitInput {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const { date, amountSpent, notes } = body as Record<string, unknown>;

  if (typeof date !== 'string' || !DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    throw new ValidationError('date is required and must be a valid YYYY-MM-DD date');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    throw new ValidationError('date cannot be in the future');
  }

  if (
    amountSpent !== undefined &&
    amountSpent !== null &&
    (typeof amountSpent !== 'number' || Number.isNaN(amountSpent) || amountSpent < 0)
  ) {
    throw new ValidationError('amountSpent must be a non-negative number');
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string' || notes.trim() === '') {
      throw new ValidationError('notes must be a non-empty string when provided');
    }
    if (notes.length > 2000) {
      throw new ValidationError('notes must be 2000 characters or fewer');
    }
  }

  return {
    date,
    amountSpent: (amountSpent as number | null | undefined) ?? null,
    notes: (notes as string | null | undefined) ?? null,
  };
}
