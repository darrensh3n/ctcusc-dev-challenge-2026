import Link from 'next/link';
import { getRestaurant, getRestaurantSummary, getVisits } from '@/lib/apiClient';
import VisitsPanel from './VisitsPanel';

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const [restaurant, visits, summary] = await Promise.all([
    getRestaurant(params.id),
    getVisits(params.id),
    getRestaurantSummary(params.id),
  ]);

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        &larr; All restaurants
      </Link>

      <h2 className="mt-2 text-lg font-medium">{restaurant.name}</h2>
      <div className="mt-1 text-sm text-gray-600">
        {restaurant.cuisine} · {restaurant.address} · {restaurant.rating}★
      </div>

      <div className="mt-4 flex gap-6 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div>
          <div className="text-gray-500">Visits</div>
          <div className="font-medium">{summary.visitCount}</div>
        </div>
        <div>
          <div className="text-gray-500">Total spent</div>
          <div className="font-medium">${summary.totalSpent.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Average per visit</div>
          <div className="font-medium">
            {summary.averageSpent === null ? '—' : `$${summary.averageSpent.toFixed(2)}`}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Average visit rating</div>
          <div className="font-medium">
            {summary.averageRating === null ? '—' : `${summary.averageRating}★`}
          </div>
        </div>
      </div>

      <VisitsPanel restaurantId={restaurant.id} initialVisits={visits} />
    </div>
  );
}
