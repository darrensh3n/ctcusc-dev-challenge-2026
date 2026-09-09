# Write-up

## 1. What did you build for Part B, and why that?

I built the `visits` API and UI: logging a visit to a restaurant with a date,
amount spent, and optional review notes, plus a per-restaurant summary
(visit count, total spent, average spent).

I picked this over filters/search or a link-out to Yelp/Google because those
don't touch anything a reviewer can grade judgment on - filters are query-param
plumbing on an endpoint that already exists, and a Yelp link is a static `<a>`
tag with no `/api` work behind it at all.

I built this feature because as a frequent Yelp user, a restaurant with a rating and
zero reviews doesn't help me as I can't tell if the rating is real or or if the
place has just gotten worse since. I combined visits and reviews into one record 
instead of two because they're the same event: the food and service at a restaurant
can drift visit to visit. A review is pinned to which visit it's describing.


## 2. What did you decide, and what did you rule out?

I nested the routes under the restaurant (`/api/restaurants/:id/visits`)
instead of a flat `/api/visits` because a visit doesn't mean anything without
its restaurant. I made `date` required but `notes` and `amountSpent`
optional: you can log that you went without writing a review, but a visit
still needs a date. I also added `GET /api/restaurants/:id/summary` on top of
the plain CRUD, since total spend and average spend is what I'd actually want
to see as the user, not just a list of rows.

I ruled out a separate `reviews` table split off from visits. I thought about
it, but a review with no visit behind it is the exact problem I was trying to
fix - an opinion floating with no proof it happened.

One tradeoff from merging reviews into `visits` instead of a separate table:
a review can't exist without a full visit record. Every review needs a
`date` attached, since that's required on `visits`, and deleting a visit
deletes its review with it, because they're the same row. A separate
`reviews` table would let you keep review history independent of visit
records - I gave that up on purpose, since a review with no visit behind it
was the exact problem I was trying to solve, but it does mean you lose a
review the moment you delete the visit it's attached to.


## 3. Where did you cut corners?

There's no edit-visit UI. `PUT` works and I tested it with curl, but the
detail page only has buttons to add or delete a visit, not edit one. There's
no pagination on the visits list either - fine now with a few seed rows, but
it wouldn't hold up for a restaurant with fifty visits logged. `averageSpent`
also just skips visits with no `amountSpent` instead of telling you some
visits weren't costed. With another day I'd build the edit form first, since
`PUT` already works and it's the missing piece of the CRUD story the UI
tells.

## 4. What should we look at first?

`client/app/api/restaurants/[id]/visits/route.ts` and
`.../visits/[visitId]/route.ts` for the API, then
`client/app/restaurants/[id]/page.tsx` and `VisitsPanel.tsx` for the UI. The
summary endpoint (`.../summary/route.ts`) is the smallest file but the one I'd
point to first - it's the part that isn't just CRUD.

---

## Part B: routes

All four live under a restaurant, since a visit has no meaning without one.
`:id` is the restaurant id, `:visitId` the visit id - both follow the same
"not a positive integer -> 404" rule as Part A.

| Method and path                                   | What it does                          | Success            | Errors                                                    |
| -------------------------------------------------- | -------------------------------------- | ------------------- | ---------------------------------------------------------- |
| `GET /api/restaurants/:id/visits`                 | List a restaurant's visits, newest first | `200` + JSON array | `404` if restaurant missing                                |
| `POST /api/restaurants/:id/visits`                | Log a visit (review notes optional)    | `201` + created visit | `404` if restaurant missing, `400` on invalid body        |
| `PUT /api/restaurants/:id/visits/:visitId`        | Update a visit's date/amount/notes     | `200` + updated visit | `404` if visit missing, `400` on invalid body            |
| `DELETE /api/restaurants/:id/visits/:visitId`     | Delete a visit                         | `204`, no body      | `404` if visit missing                                     |
| `GET /api/restaurants/:id/summary`                | Aggregate visit stats for a restaurant | `200` + summary     | `404` if restaurant missing                                |

Visit shape:

```jsonc
{
  "id": 4,
  "restaurantId": 1,
  "date": "2026-09-01",       // YYYY-MM-DD, required, cannot be in the future
  "amountSpent": 24.5,        // number >= 0, or null
  "notes": "Great ramen, salty broth", // non-empty string <= 2000 chars, or null
  "createdAt": "2026-09-09T07:31:11.260Z"
}
```

**`POST /api/restaurants/:id/visits`**

```jsonc
// request
{ "date": "2026-09-01", "amountSpent": 24.5, "notes": "Great ramen, salty broth" }

// 201 response
{ "id": 4, "restaurantId": 1, "date": "2026-09-01", "amountSpent": 24.5,
  "notes": "Great ramen, salty broth", "createdAt": "2026-09-09T07:31:11.260Z" }
```

**`GET /api/restaurants/:id/summary`**

```jsonc
// 200 response
{ "restaurantId": 1, "visitCount": 3, "totalSpent": 85, "averageSpent": 28.33 }
```

`averageSpent` is `null` when no visit for the restaurant has a recorded
`amountSpent` (visits with a null amount aren't counted toward it).

## Schema changes

None. `visits` was already defined in `001_create_tables.sql` with a
`restaurantId` foreign key (`ON DELETE CASCADE`) and an index on
`restaurantId` - I only had to write the API and UI on top of it. The
`toVisit()` row mapper in `lib/types.ts` was likewise already there, unused
before this.

## How I verified this

> How you checked your work - the happy paths _and_ the failures. `curl`
> commands, a Postman collection, a scratch script, screenshots: whatever you
> actually used. Paste the commands.
>
> This is much faster for us to review than working it out ourselves, and it's
> how you show you checked the edge cases.

**Part A** - the contract table in CHALLENGE.md, every row including the error
cases:

```bash
# reads
curl -i http://localhost:3000/api/restaurants           # 200 + array
curl -i http://localhost:3000/api/restaurants/1         # 200 + restaurant
curl -i http://localhost:3000/api/restaurants/99999     # 404, no such id
curl -i http://localhost:3000/api/restaurants/abc       # 404, not an integer
curl -i http://localhost:3000/api/restaurants/-1        # 404, not positive
curl -i http://localhost:3000/api/restaurants/1.5       # 404, not an integer

# create
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Valid Spot","cuisine":"Test","address":"2 Test St","rating":4.5}'
  # 201 + created restaurant (with id)
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' -d '{"rating":4}'
  # 400, name is required
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' -d '{"name":"Out Of Range","rating":6}'
  # 400, rating outside 0-5
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' -d '{not json'
  # 400, malformed body 

# update (against the id created above)
curl -i -X PUT http://localhost:3000/api/restaurants/<id> \
  -H 'Content-Type: application/json' -d '{"name":"Updated Spot","rating":3}'
  # 200 + updated restaurant
curl -i -X PUT http://localhost:3000/api/restaurants/99999 \
  -H 'Content-Type: application/json' -d '{"name":"x","rating":3}'
  # 404, no such id
curl -i -X PUT http://localhost:3000/api/restaurants/<id> \
  -H 'Content-Type: application/json' -d '{"rating":9}'
  # 400, invalid body

# delete
curl -i -X DELETE http://localhost:3000/api/restaurants/<id>   # 204, no body
curl -i -X DELETE http://localhost:3000/api/restaurants/99999  # 404, no such id
```

Ran all of the above locally after `POST`ing a scratch restaurant, capturing
its `id` for the `PUT`/`DELETE` cases, then deleting it at the end so seed
data was left intact. Every case returned the status the contract table
requires - no `500`s anywhere, including the malformed-body and bad-id cases
that weren't handled before A3.

**Part B** - the equivalent cases for what you built:

```bash
# reads
curl -i http://localhost:3000/api/restaurants/1/visits         # 200 + array
curl -i http://localhost:3000/api/restaurants/99999/visits     # 404, no such restaurant
curl -i http://localhost:3000/api/restaurants/abc/visits       # 404, not an integer
curl -i http://localhost:3000/api/restaurants/1/summary        # 200 + {visitCount, totalSpent, averageSpent}
curl -i http://localhost:3000/api/restaurants/99999/summary    # 404, no such restaurant

# create - review notes optional
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-09-01","amountSpent":24.5,"notes":"Great ramen, salty broth"}'
  # 201 + created visit
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' -d '{"date":"2026-09-05","amountSpent":18}'
  # 201 + created visit, notes null - confirms a review isn't mandatory
curl -i -X POST http://localhost:3000/api/restaurants/99999/visits \
  -H 'Content-Type: application/json' -d '{"date":"2026-09-01"}'
  # 404, no such restaurant
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' -d '{"amountSpent":10}'
  # 400, date is required
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' -d '{"date":"2099-01-01"}'
  # 400, date cannot be in the future
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' -d '{"date":"2026-09-01","amountSpent":-5}'
  # 400, amountSpent must be non-negative
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' -d '{"date":"2026-09-01","notes":"   "}'
  # 400, notes must be non-empty when provided
curl -i -X POST http://localhost:3000/api/restaurants/1/visits \
  -H 'Content-Type: application/json' -d '{bad json'
  # 400, malformed body

# update (against the visit ids created above)
curl -i -X PUT http://localhost:3000/api/restaurants/1/visits/<id> \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-09-01","amountSpent":30,"notes":"Updated: even better second read"}'
  # 200 + updated visit
curl -i -X PUT http://localhost:3000/api/restaurants/1/visits/99999 \
  -H 'Content-Type: application/json' -d '{"date":"2026-09-01"}'
  # 404, no such visit

# delete - scoped to the restaurant in the URL, not just the visit id
curl -i -X DELETE http://localhost:3000/api/restaurants/2/visits/<id-that-belongs-to-restaurant-1>
  # 404, that visit isn't restaurant 2's
curl -i -X DELETE http://localhost:3000/api/restaurants/1/visits/<id>   # 204, no body
```

Ran all of the above locally, plus clicked through the UI at
`/restaurants/1`: logged a visit with notes, logged one without, deleted one,
and confirmed the visit count/total/average tile updated each time. Every
case above returned the status the table says it should - no `500`s,
including the not-found restaurant, not-found visit, and malformed-body
cases.

## Known issues / what I'd do next

- No edit-visit UI (see Q3) - `PUT` works, curl-tested, just no form for it.
- No pagination on `GET /api/restaurants/:id/visits` - fine for seed data,
  would need it for a restaurant with many visits.
- Deleting a restaurant cascades to its visits (`ON DELETE CASCADE` in the
  original migration) - I kept that behavior rather than blocking the delete,
  since a restaurant with no visits left to reference is a reasonable thing
  to allow deleting.
