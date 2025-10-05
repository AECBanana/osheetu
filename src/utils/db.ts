import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
export const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

// 执行SQL查询
export const query = async (sql: string, params?: any[]) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL查询错误:', error);
    throw error;
  }
};

// 数据库初始化函数
export const ensureMapPoolColumns = async () => {
  const columnsToCheck: Array<{
    name: string;
    alter: string;
  }> = [
      {
        name: "beatmapset_id",
        alter: "ALTER TABLE map_pools ADD COLUMN beatmapset_id BIGINT UNSIGNED",
      },
      {
        name: "cover_url",
        alter: "ALTER TABLE map_pools ADD COLUMN cover_url VARCHAR(512)",
      },
      {
        name: "ar",
        alter: "ALTER TABLE map_pools ADD COLUMN ar DECIMAL(4,2) DEFAULT NULL",
      },
      {
        name: "cs",
        alter: "ALTER TABLE map_pools ADD COLUMN cs DECIMAL(4,2) DEFAULT NULL",
      },
      {
        name: "od",
        alter: "ALTER TABLE map_pools ADD COLUMN od DECIMAL(4,2) DEFAULT NULL",
      },
      {
        name: "hp",
        alter: "ALTER TABLE map_pools ADD COLUMN hp DECIMAL(4,2) DEFAULT NULL",
      },
      {
        name: "beatmap_id",
        alter: "ALTER TABLE map_pools MODIFY COLUMN beatmap_id BIGINT UNSIGNED NOT NULL",
      },
      {
        name: "length",
        alter: "ALTER TABLE map_pools MODIFY COLUMN length VARCHAR(16) NOT NULL",
      },
      {
        name: "mod_value",
        alter: "ALTER TABLE map_pools MODIFY COLUMN mod_value VARCHAR(20) NOT NULL",
      },
      {
        name: "stars",
        alter: "ALTER TABLE map_pools MODIFY COLUMN stars DECIMAL(4,2) NOT NULL",
      },
    ];

  for (const column of columnsToCheck) {
    try {
      const result = (await query(
        `SHOW COLUMNS FROM map_pools LIKE ?`,
        [column.name]
      )) as RowDataPacket[];

      if (result.length === 0) {
        try {
          await query(column.alter);
        } catch (error) {
          console.warn(`尝试添加/修改 map_pools 列 ${column.name} 失败（可能已存在或缺少权限）:`, error);
        }
      }
    } catch (error) {
      console.warn(`检查 map_pools 列 ${column.name} 状态失败:`, error);
    }
  }
};

export const initDatabase = async () => {
  try {
    // 创建用户表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        osu_id VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
        token_expires_at DATETIME,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建用户组表
    await query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        group_name VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建比赛表
    await query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        mode ENUM('osu', 'taiko', 'mania', 'catch') NOT NULL,
        type ENUM('team', 'player') NOT NULL,
        stages TEXT NOT NULL,
        current_stage VARCHAR(50) NOT NULL,
        status ENUM('active', 'completed', 'upcoming') NOT NULL,
        include_qualifier BOOLEAN DEFAULT FALSE,
        allow_custom_mods BOOLEAN DEFAULT FALSE,
        settings JSON NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // 创建比赛参与者表
    await query(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tournament_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('player', 'captain', 'referee', 'staff') DEFAULT 'player',
        status ENUM('active', 'pending', 'banned') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_participant (tournament_id, user_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建图池表
    await query(`
      CREATE TABLE IF NOT EXISTS map_pools (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tournament_id INT NOT NULL,
        beatmapset_id BIGINT UNSIGNED,
        beatmap_id BIGINT UNSIGNED NOT NULL,
        cover_url VARCHAR(512),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        mapper VARCHAR(255) NOT NULL,
        difficulty VARCHAR(100) NOT NULL,
        mod_value VARCHAR(20) NOT NULL,
        stars DECIMAL(4,2) NOT NULL,
        ar DECIMAL(4,2) DEFAULT NULL,
        cs DECIMAL(4,2) DEFAULT NULL,
        od DECIMAL(4,2) DEFAULT NULL,
        hp DECIMAL(4,2) DEFAULT NULL,
        bpm INT NOT NULL,
        length VARCHAR(16) NOT NULL,
        tags TEXT,
        added_by INT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id)
      )
    `);

    // 创建分数记录表
    await query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        map_pool_id INT,
        score INT NOT NULL,
        accuracy DECIMAL(5,2) NOT NULL,
        combo INT NOT NULL,
        mod_used VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (map_pool_id) REFERENCES map_pools(id) ON DELETE CASCADE
      )
    `);

    try {
      await query(`
        ALTER TABLE users
          MODIFY COLUMN access_token TEXT NULL,
          MODIFY COLUMN refresh_token TEXT NULL
      `);
    } catch (error) {
      console.warn('调整用户令牌字段长度失败（可能已是最新结构）:', error);
    }

    await ensureTournamentExtendedColumns();

    console.log('数据库表创建成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

export default pool;

export const ensureTournamentExtendedColumns = async () => {
  const columnsToCheck: Array<{
    name: string;
    alter: string;
  }> = [
      {
        name: "include_qualifier",
        alter: "ALTER TABLE tournaments ADD COLUMN include_qualifier BOOLEAN DEFAULT FALSE",
      },
      {
        name: "allow_custom_mods",
        alter: "ALTER TABLE tournaments ADD COLUMN allow_custom_mods BOOLEAN DEFAULT FALSE",
      },
      {
        name: "settings",
        alter: "ALTER TABLE tournaments ADD COLUMN settings JSON NULL",
      },
    ];

  for (const column of columnsToCheck) {
    try {
      const result = (await query(
        `SHOW COLUMNS FROM tournaments LIKE ?`,
        [column.name]
      )) as RowDataPacket[];

      if (result.length === 0) {
        try {
          await query(column.alter);
        } catch (error) {
          console.warn(`尝试添加列 ${column.name} 失败（可能已存在或缺少权限）:`, error);
        }
      }
    } catch (error) {
      console.warn(`检查列 ${column.name} 状态失败:`, error);
    }
  }
};
