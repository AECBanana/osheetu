import mysql from 'mysql2/promise';

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
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL查询错误:', error);
    throw error;
  }
};

// 数据库初始化函数
export const initDatabase = async () => {
  try {
    // 创建用户表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        osu_id VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        access_token VARCHAR(255),
        refresh_token VARCHAR(255),
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
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // 创建图池表
    await query(`
      CREATE TABLE IF NOT EXISTS map_pools (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tournament_id INT,
        beatmap_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        mapper VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        mod_value VARCHAR(10) NOT NULL,
        stars DECIMAL(4,2) NOT NULL,
        bpm INT NOT NULL,
        length VARCHAR(10) NOT NULL,
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

    console.log('数据库表创建成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

export default pool;