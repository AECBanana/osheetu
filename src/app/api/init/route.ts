import { NextResponse } from 'next/server';
import { testDbConnection, initDatabase } from '../../../utils/db';

// 检查数据库连接状态
export async function GET() {
  try {
    const connected = await testDbConnection();
    
    if (connected) {
      return NextResponse.json({
        success: true,
        message: '数据库连接成功',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '数据库连接失败，请检查配置',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('数据库连接检查失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '数据库连接检查时发生错误',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// 初始化数据库
export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '数据库初始化失败',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}