import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';
import { parseId, validateRestaurantBody } from '@/lib/validation';

type Params = { params: { id: string } };

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant, or 404 if it doesn't exist.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = parseId(params.id);

    const { rows } = await pool.query(
      'SELECT id, name, cuisine, address, rating, created_at AS "createdAt" FROM restaurants WHERE id = $1 ORDER BY created_at DESC',
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PUT /api/restaurants/:id
 * Update an existing restaurant.
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const id = parseId(params.id);
    const body = await req.json();
    const { name, cuisine, address, rating } = validateRestaurantBody(body);

    const { rows } = await pool.query(
      `UPDATE restaurants
       SET name = $1,
           cuisine = $2,
           address = $3,
           rating = $4
       WHERE id = $5
       RETURNING id, name, cuisine, address, rating, created_at AS "createdAt"`,
      [name, cuisine, address, rating, id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant.
 *
 * Worth noticing: the migration already made a call about what happens to that
 * restaurant's visits. Go read it. If you disagree with it, say so in your
 * write-up.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = parseId(params.id);

    const { rowCount } = await pool.query('DELETE FROM restaurants WHERE id = $1', [id]);

    if (rowCount === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
