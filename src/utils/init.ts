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
      console.log('\n检测到Vercel环境，配置建议:');
      
      // NEXTAUTH配置建议
      if (!process.env.NEXTAUTH_SECRET) {
        console.log('⚠️ 重要: 在Vercel生产环境中，必须设置NEXTAUTH_SECRET环境变量');
        console.log('  如何设置: 在Vercel项目设置 > Environment Variables中添加');
        console.log('  生成方法: 可以使用命令 openssl rand -base64 32 生成一个安全的密钥');
      }
      
      if (!process.env.NEXTAUTH_URL) {
        console.log('ℹ️ 提示: 在Next.js 13+和Vercel环境中，NEXTAUTH_URL通常会自动检测');
        console.log('  如需手动设置，请确保值与您的实际域名一致，如 https://your-app.vercel.app');
      }
      
      // OSU配置检查
      if (!process.env.OSU_CLIENT_ID || !process.env.OSU_CLIENT_SECRET) {
        console.log('⚠️ OSU认证配置不完整，登录功能可能无法使用');
        console.log('  请确保在Vercel环境变量中设置了OSU_CLIENT_ID和OSU_CLIENT_SECRET');
      }
      
      console.log('\n环境变量设置指南:');
      console.log('1. 访问 https://vercel.com/[your-username]/[your-project]/settings/environment-variables');
      console.log('2. 添加所有必要的环境变量（包括OSU和数据库配置）');
      console.log('3. 确保生产环境和预览环境都已正确配置');
      console.log('4. 部署后，环境变量会自动应用到您的应用');
      console.log('');
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