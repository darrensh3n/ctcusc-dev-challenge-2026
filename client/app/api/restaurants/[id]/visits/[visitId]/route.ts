import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toVisit } from '@/lib/types';
import { parseId, validateVisitBody } from '@/lib/validation';

type Params = { params: { id: string; visitId: string } };

const VISIT_COLUMNS = `id, "restaurantId", date, "amountSpent", notes, created_at AS "createdAt"`;

/**
 * PUT /api/restaurants/:id/visits/:visitId
 * Update a visit's date, amount spent, or review notes.
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);
    const visitId = parseId(params.visitId);
    const body = await req.json();
    const { date, amountSpent, notes } = validateVisitBody(body);

    const { rows } = await pool.query(
      `UPDATE visits
       SET date = $1,
           "amountSpent" = $2,
           notes = $3
       WHERE id = $4 AND "restaurantId" = $5
       RETURNING ${VISIT_COLUMNS}`,
      [date, amountSpent, notes, visitId, restaurantId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Visit not found');
    }

    return NextResponse.json(toVisit(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/restaurants/:id/visits/:visitId
 * Remove a logged visit.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);
    const visitId = parseId(params.visitId);

    const { rowCount } = await pool.query(
      'DELETE FROM visits WHERE id = $1 AND "restaurantId" = $2',
      [visitId, restaurantId]
    );

    if (rowCount === 0) {
      throw new NotFoundError('Visit not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
