import { initDatabase, testDbConnection } from './db';

// 初始化应用数据
export const initializeApp = async () => {
  try {
    console.log('开始初始化应用...');

    // 检测当前环境
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = !!process.env.VERCEL;

    // 环境变量配置状态
    const envConfig = {
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
    };

    console.log('环境变量配置:', envConfig);

    // Vercel环境特定的配置建议
    if (isVercel) {
      console.log('检测到Vercel环境部署');
      // OSU配置检查
      if (!process.env.OSU_CLIENT_ID || !process.env.OSU_CLIENT_SECRET) {
        console.log('⚠️ OSU认证配置不完整，登录功能可能无法使用');
        console.log('  请确保在Vercel环境变量中设置了OSU_CLIENT_ID和OSU_CLIENT_SECRET');
      }

    }

    // 生产环境检查
    if (isProduction && !isVercel) {
      if (!process.env.NEXTAUTH_SECRET) {
        console.error('❌ 错误: 在生产环境中，NEXTAUTH_SECRET是必需的，用于会话加密');
        console.error('  请在.env.local文件中设置这个环境变量');
      }

      if (!process.env.NEXTAUTH_URL) {
        console.error('❌ 错误: 在生产环境中，NEXTAUTH_URL是必需的，用于OAuth回调');
      }
    }

    // 测试数据库连接
    // 在Vercel环境中，如果数据库连接失败，可能需要检查连接字符串配置
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      console.warn('数据库连接失败，将使用模拟数据运行');
      if (isVercel) {
        console.warn('  在Vercel中，您可能需要使用Vercel Postgres或其他云数据库服务');
        console.warn('  或者确保数据库允许来自Vercel IP的连接');
      }
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