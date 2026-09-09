import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { parseId } from '@/lib/validation';

type Params = { params: { id: string } };

export interface RestaurantSummary {
  restaurantId: number;
  visitCount: number;
  totalSpent: number;
  averageSpent: number | null;
}

/**
 * GET /api/restaurants/:id/summary
 * Aggregate visit stats for a restaurant: how many times you've been, and
 * what it's cost you. `averageSpent` is null when no visit has a recorded
 * amount (visits with a null amountSpent don't count toward it).
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);

    const { rows: restaurantRows } = await pool.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [restaurantId]
    );
    if (restaurantRows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS "visitCount",
         COALESCE(SUM("amountSpent"), 0) AS "totalSpent",
         AVG("amountSpent") AS "averageSpent"
       FROM visits
       WHERE "restaurantId" = $1`,
      [restaurantId]
    );

    const row = rows[0];
    const summary: RestaurantSummary = {
      restaurantId,
      visitCount: row.visitCount,
      totalSpent: Number(row.totalSpent),
      averageSpent: row.averageSpent === null ? null : Math.round(Number(row.averageSpent) * 100) / 100,
    };

    return NextResponse.json(summary);
  } catch (err) {
    return handleError(err);
  }
}
