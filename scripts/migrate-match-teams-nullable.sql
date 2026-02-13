-- If you already ran the original schema with team_a_id/team_b_id NOT NULL,
-- run this to allow creating matches without teams (e.g. from API):
-- mysql -u root -p cricket_live < scripts/migrate-match-teams-nullable.sql

ALTER TABLE `match`
  MODIFY COLUMN `team_a_id` INT UNSIGNED DEFAULT NULL,
  MODIFY COLUMN `team_b_id` INT UNSIGNED DEFAULT NULL;
