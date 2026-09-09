# Write-up

> This is the skeleton - replace everything in blockquotes with your own words
> and delete the prompts as you go. Aim for **~300 words** across the four
> questions; the route reference below can be as long as it needs to be.
>
> Write it like you're handing the work to a teammate. We'd rather read an
> honest "I ran out of time on X and here's what I'd do" than a polished list of
> accomplishments. **Submit this even if you didn't finish** - see CHALLENGE.md.

## 1. What did you build for Part B, and why that?

> What made you pick it over everything else you could have built? This is the
> question we care most about - the _why_ matters more than the _what_.

## 2. What did you decide, and what did you rule out?

> Route shapes, data model, where the logic lives, what you deliberately didn't
> do. Name a tradeoff you're not sure you got right.

## 3. Where did you cut corners?

> What would you fix first with another day?

---

## Part B: routes

> Every endpoint you added, with its request and response shapes, so we can
> exercise it without reverse-engineering your code. Add or remove rows as
> needed; delete this section if your Part B added no routes.

| Method and path | What it does | Success | Errors       |
| --------------- | ------------ | ------- | ------------ |
| `GET /api/...`  |              | `200` + | `404` if ... |
| `POST /api/...` |              | `201` + | `400` on ... |

**`POST /api/...`**

```jsonc
// request
{ }

// 201 response
{ }
```

## Schema changes

> Any migrations you added (`002_*.sql`, ...), new tables or columns, and
> anything a reviewer needs to run beyond `./setup.sh`. Write "none" if there
> were none.

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

```

## Known issues / what I'd do next

> Anything broken, unfinished, or that you know is wrong. Being upfront here
> costs you nothing and tells us a lot.
