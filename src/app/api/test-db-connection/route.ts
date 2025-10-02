import { NextResponse } from 'next/server';
import { testDbConnection } from '@/utils/db';

export async function GET() {
  try {
    // 检查必要的数据库环境变量是否存在
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('数据库连接测试失败 - 缺少必要的环境变量:', missingVars);
      return NextResponse.json({
        success: false,
        message: `缺少数据库配置环境变量: ${missingVars.join(', ')}`,
        missingVars: missingVars,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // 尝试实际连接数据库
    const connectionResult = await testDbConnection();
    
    if (connectionResult) {
      console.log('数据库连接测试成功');
      return NextResponse.json({
        success: true,
        message: '数据库连接测试成功',
        dbHost: process.env.DB_HOST,
        dbPort: process.env.DB_PORT,
        dbName: process.env.DB_NAME,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('数据库连接测试失败');
      return NextResponse.json({
        success: false,
        message: '数据库连接测试失败，请检查数据库配置和网络连接',
        dbHost: process.env.DB_HOST,
        dbPort: process.env.DB_PORT,
        dbName: process.env.DB_NAME,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('数据库连接测试过程中发生异常:', error);
    return NextResponse.json({
      success: false,
      message: `数据库连接测试异常: ${error instanceof Error ? error.message : '未知错误'}`,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}