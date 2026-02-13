/**
 * Create all tables if they don't exist. Run on first startup when database exists.
 * Order: user → team, player, match → match_player, ball, player_score, innings.
 */
const TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`user\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`email\` VARCHAR(255) NOT NULL,
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`name\` VARCHAR(255) DEFAULT NULL,
    \`role\` ENUM('umpire', 'viewer') DEFAULT 'umpire',
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uq_user_email\` (\`email\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`team\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`player\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`match\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`team_a_id\` INT UNSIGNED DEFAULT NULL,
    \`team_b_id\` INT UNSIGNED DEFAULT NULL,
    \`venue\` VARCHAR(255) DEFAULT NULL,
    \`match_date\` DATE DEFAULT NULL,
    \`status\` ENUM('scheduled', 'live', 'completed') DEFAULT 'scheduled',
    \`created_by_user_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`idx_match_status\` (\`status\`),
    KEY \`idx_match_date\` (\`match_date\`),
    KEY \`idx_match_created_by\` (\`created_by_user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`match_player\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`match_id\` INT UNSIGNED NOT NULL,
    \`player_id\` INT UNSIGNED NOT NULL,
    \`team_side\` ENUM('A', 'B') NOT NULL,
    \`batting_order\` TINYINT UNSIGNED DEFAULT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uq_match_player_side\` (\`match_id\`, \`player_id\`, \`team_side\`),
    KEY \`idx_match_player_match\` (\`match_id\`),
    KEY \`idx_match_player_player\` (\`player_id\`),
    CONSTRAINT \`fk_mp_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`match\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_mp_player\` FOREIGN KEY (\`player_id\`) REFERENCES \`player\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`ball\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`match_id\` INT UNSIGNED NOT NULL,
    \`over_number\` SMALLINT UNSIGNED NOT NULL,
    \`ball_in_over\` TINYINT UNSIGNED NOT NULL,
    \`is_legal_delivery\` TINYINT(1) NOT NULL DEFAULT 1,
    \`runs_batter\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    \`runs_extra\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    \`extra_type\` VARCHAR(20) DEFAULT NULL,
    \`striker_id\` INT UNSIGNED NOT NULL,
    \`non_striker_id\` INT UNSIGNED NOT NULL,
    \`bowler_id\` INT UNSIGNED NOT NULL,
    \`wicket_type\` VARCHAR(30) DEFAULT NULL,
    \`dismissed_player_id\` INT UNSIGNED DEFAULT NULL,
    \`next_striker_id\` INT UNSIGNED DEFAULT NULL,
    \`next_non_striker_id\` INT UNSIGNED DEFAULT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`idx_ball_match\` (\`match_id\`),
    KEY \`idx_ball_match_order\` (\`match_id\`, \`id\`),
    CONSTRAINT \`fk_ball_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`match\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_ball_striker\` FOREIGN KEY (\`striker_id\`) REFERENCES \`player\` (\`id\`),
    CONSTRAINT \`fk_ball_non_striker\` FOREIGN KEY (\`non_striker_id\`) REFERENCES \`player\` (\`id\`),
    CONSTRAINT \`fk_ball_bowler\` FOREIGN KEY (\`bowler_id\`) REFERENCES \`player\` (\`id\`),
    CONSTRAINT \`fk_ball_dismissed\` FOREIGN KEY (\`dismissed_player_id\`) REFERENCES \`player\` (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`player_score\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`match_id\` INT UNSIGNED NOT NULL,
    \`player_id\` INT UNSIGNED NOT NULL,
    \`runs\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`balls_faced\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`fours\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`sixes\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`wickets\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`overs_bowled\` DECIMAL(5,1) NOT NULL DEFAULT 0,
    \`runs_conceded\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uq_player_score_match_player\` (\`match_id\`, \`player_id\`),
    KEY \`idx_ps_match\` (\`match_id\`),
    CONSTRAINT \`fk_ps_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`match\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_ps_player\` FOREIGN KEY (\`player_id\`) REFERENCES \`player\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS \`innings\` (
    \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`match_id\` INT UNSIGNED NOT NULL,
    \`innings_number\` TINYINT UNSIGNED NOT NULL,
    \`batting_team_side\` ENUM('A', 'B') NOT NULL,
    \`bowling_team_side\` ENUM('A', 'B') NOT NULL,
    \`total_runs\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`total_wickets\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    \`total_overs\` DECIMAL(5,1) NOT NULL DEFAULT 0,
    \`extras\` INT UNSIGNED NOT NULL DEFAULT 0,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uq_innings_match_num\` (\`match_id\`, \`innings_number\`),
    CONSTRAINT \`fk_innings_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`match\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function ensureTables(pool) {
  const conn = await pool.getConnection();
  try {
    for (const sql of TABLE_STATEMENTS) {
      await conn.query(sql);
    }
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ball' AND COLUMN_NAME = 'next_striker_id'`
    );
    if (cols.length === 0) {
      await conn.query(
        `ALTER TABLE ball ADD COLUMN next_striker_id INT UNSIGNED DEFAULT NULL AFTER dismissed_player_id, ADD COLUMN next_non_striker_id INT UNSIGNED DEFAULT NULL AFTER next_striker_id`
      );
      console.log('Ball table: added next_striker_id, next_non_striker_id.');
    }
    const [matchCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'match' AND COLUMN_NAME = 'created_by_user_id'`
    );
    if (matchCols.length === 0) {
      await conn.query(`ALTER TABLE \`match\` ADD COLUMN created_by_user_id INT UNSIGNED DEFAULT NULL AFTER status, ADD KEY idx_match_created_by (created_by_user_id)`);
      console.log('Match table: added created_by_user_id.');
    }
    console.log('Database tables ready (created if not existed).');
  } finally {
    conn.release();
  }
}

module.exports = { ensureTables };
