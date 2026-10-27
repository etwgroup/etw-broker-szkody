-- Add the insurer's own claim number as an explicit workflow stage.
-- This is deliberately separate from the next migration: PostgreSQL makes a
-- newly added enum value available only after this migration commits.

alter type public.claim_status add value if not exists 'insurer_claim_number_assigned' after 'submitted_to_insurer';
