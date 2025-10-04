import { initDatabase, testDbConnection } from './db';

// 初始化应用数据
export const initializeApp = async () => {
  try {
    console.log('开始初始化应用...');
    console.log('环境变量配置:', {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '已设置' : '未设置',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '已设置' : '未设置',
      OSU_CLIENT_ID: process.env.OSU_CLIENT_ID ? '已设置' : '未设置',
      OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET ? '已设置' : '未设置',
      OSU_REDIRECT_URI: process.env.OSU_REDIRECT_URI ? '已设置' : '未设置',
      DB_HOST: process.env.DB_HOST ? '已设置' : '未设置',
      DB_PORT: process.env.DB_PORT ? '已设置' : '未设置',
      DB_USER: process.env.DB_USER ? '已设置' : '未设置',
      DB_PASSWORD: process.env.DB_PASSWORD ? '已设置' : '未设置',
      DB_NAME: process.env.DB_NAME ? '已设置' : '未设置',
    });
    
    // 测试数据库连接
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      console.warn('数据库连接失败，将使用模拟数据运行');
      return false;
    }
    
    // 初始化数据库表结构
    await initDatabase();
    console.log('应用初始化成功');
    return true;
  } catch (error) {
    console.error('应用初始化失败:', error);
    return false;
  }
};