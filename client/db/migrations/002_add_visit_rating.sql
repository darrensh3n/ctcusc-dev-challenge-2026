-- Migration 002: add a per-visit rating.
--
-- restaurants.rating (from 001) is a single overall number set by hand.
-- This adds a rating per visit instead - food and service can drift
-- visit to visit, so one static number on the restaurant doesn't capture
-- that. Same 0-5 range as restaurants.rating, nullable since not every
-- visit needs to carry one.

ALTER TABLE visits ADD COLUMN IF NOT EXISTS rating NUMERIC;
