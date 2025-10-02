import { initDatabase, testDbConnection } from './db';

// 初始化应用数据
export const initializeApp = async () => {
  try {
    console.log('开始初始化应用...');
    
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