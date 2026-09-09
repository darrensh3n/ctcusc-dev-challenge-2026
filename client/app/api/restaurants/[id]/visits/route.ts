import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toVisit } from '@/lib/types';
import { parseId, validateVisitBody } from '@/lib/validation';

type Params = { params: { id: string } };

const VISIT_COLUMNS = `id, "restaurantId", date, "amountSpent", rating, notes, created_at AS "createdAt"`;

async function assertRestaurantExists(id: number) {
  const { rows } = await pool.query('SELECT id FROM restaurants WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }
}

/**
 * GET /api/restaurants/:id/visits
 * Returns every visit logged for a restaurant, most recent first.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);
    await assertRestaurantExists(restaurantId);

    const { rows } = await pool.query(
      `SELECT ${VISIT_COLUMNS} FROM visits WHERE "restaurantId" = $1 ORDER BY date DESC, id DESC`,
      [restaurantId]
    );

    return NextResponse.json(rows.map(toVisit));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/restaurants/:id/visits
 * Log a new visit (and optional review notes) for a restaurant.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);
    await assertRestaurantExists(restaurantId);

    const body = await req.json();
    const { date, amountSpent, rating, notes } = validateVisitBody(body);

    const { rows } = await pool.query(
      `INSERT INTO visits ("restaurantId", date, "amountSpent", rating, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${VISIT_COLUMNS}`,
      [restaurantId, date, amountSpent, rating, notes]
    );

    return NextResponse.json(toVisit(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
