-- Minimal seed for development: 2 teams, 2 matches, players, match_players.
-- Run after DATABASE_SCHEMA.sql. Uses team.id for match.team_a_id / team_b_id.

INSERT INTO team (name) VALUES ('Team Alpha'), ('Team Beta');

INSERT INTO player (name) VALUES
  ('Aaron'), ('Ben'), ('Chris'), ('David'), ('Evan'),
  ('Frank'), ('Greg'), ('Henry'), ('Ivan'), ('Jack');

-- Match 1: Team Alpha (1) vs Team Beta (2)
INSERT INTO `match` (name, team_a_id, team_b_id, venue, status) VALUES
  ('Alpha vs Beta', 1, 2, 'Home Ground', 'live');

SET @match_id = LAST_INSERT_ID();

-- Batting order Team A (Alpha): 1-5
INSERT INTO match_player (match_id, player_id, team_side, batting_order) VALUES
  (@match_id, 1, 'A', 1), (@match_id, 2, 'A', 2), (@match_id, 3, 'A', 3),
  (@match_id, 4, 'A', 4), (@match_id, 5, 'A', 5);
-- Bowling side Team B (Beta)
INSERT INTO match_player (match_id, player_id, team_side, batting_order) VALUES
  (@match_id, 6, 'B', 1), (@match_id, 7, 'B', 2), (@match_id, 8, 'B', 3),
  (@match_id, 9, 'B', 4), (@match_id, 10, 'B', 5);

-- Optional: second match
INSERT INTO `match` (name, team_a_id, team_b_id, venue, status) VALUES
  ('Beta vs Alpha', 2, 1, 'Away', 'scheduled');
SET @m2 = LAST_INSERT_ID();
INSERT INTO match_player (match_id, player_id, team_side, batting_order) VALUES
  (@m2, 6, 'A', 1), (@m2, 7, 'A', 2), (@m2, 8, 'A', 3), (@m2, 9, 'A', 4), (@m2, 10, 'A', 5),
  (@m2, 1, 'B', 1), (@m2, 2, 'B', 2), (@m2, 3, 'B', 3), (@m2, 4, 'B', 4), (@m2, 5, 'B', 5);
