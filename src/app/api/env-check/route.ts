import { NextResponse } from 'next/server';

// 此端点提供另一种方式来检查和验证Vercel环境变量
// 与之前的实现不同，这个版本更加轻量，专注于核心功能
export async function GET() {
  try {
    // 定义需要检查的关键环境变量组
    const envGroups = [
      {
        name: 'OSU OAuth 配置',
        variables: [
          { key: 'NEXT_PUBLIC_OSU_CLIENT_ID', type: 'public' },
          { key: 'OSU_CLIENT_ID', type: 'private' },
          { key: 'OSU_CLIENT_SECRET', type: 'private' },
          { key: 'OSU_REDIRECT_URI', type: 'private' }
        ]
      },
      {
        name: '数据库配置',
        variables: [
          { key: 'DB_HOST', type: 'private' },
          { key: 'DB_PORT', type: 'private' },
          { key: 'DB_USER', type: 'private' },
          { key: 'DB_PASSWORD', type: 'private' },
          { key: 'DB_NAME', type: 'private' }
        ]
      },
      {
        name: '认证配置',
        variables: [
          { key: 'NEXTAUTH_SECRET', type: 'private' },
          { key: 'NEXTAUTH_URL', type: 'private' }
        ]
      },
      {
        name: '部署环境信息',
        variables: [
          { key: 'NODE_ENV', type: 'info' },
          { key: 'VERCEL_ENV', type: 'info' },
          { key: 'VERCEL_URL', type: 'info' },
          { key: 'VERCEL_PROJECT_ID', type: 'info' }
        ]
      }
    ];

    // 检查每个环境变量组
    const results = envGroups.map(group => ({
      name: group.name,
      variables: group.variables.map(variable => ({
        key: variable.key,
        exists: !!process.env[variable.key],
        type: variable.type,
        // 对于信息类型的变量，可以显示其值（非敏感）
        value: variable.type === 'info' && process.env[variable.key] ? 
          process.env[variable.key] : 
          (variable.type === 'public' && process.env[variable.key] ? '已设置（客户端可访问）' : '已设置（服务器端）')
      })),
      allSet: group.variables.every(variable => !!process.env[variable.key])
    }));

    // 检查是否所有必需的环境变量都已设置
    const allRequiredVarsSet = results.every(group => group.allSet);

    // 收集缺失的环境变量
    const missingVars = results
      .flatMap(group => 
        group.variables
          .filter(variable => !process.env[variable.key])
          .map(variable => ({ group: group.name, key: variable.key }))
      );

    // 生成状态报告
    const statusReport = {
      success: allRequiredVarsSet,
      message: allRequiredVarsSet ? '所有环境变量已正确配置！' : '缺少一些环境变量，请检查并修复后重新部署。',
      timestamp: new Date().toISOString(),
      missingVariables: missingVars,
      totalChecked: envGroups.reduce((sum, group) => sum + group.variables.length, 0),
      totalMissing: missingVars.length,
      results: results
    };

    // 将详细信息记录到服务器日志
    console.log('环境变量检查报告:', {
      success: allRequiredVarsSet,
      missingVarsCount: missingVars.length,
      missingVars: missingVars.map(v => v.key),
      timestamp: statusReport.timestamp
    });

    return NextResponse.json(statusReport);
  } catch (error) {
    // 处理可能的错误
    console.error('环境变量检查过程中发生错误:', error);
    return NextResponse.json(
      {
        success: false,
        message: '检查环境变量时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      },
      {
        status: 500
      }
    );
  }
}

// 添加POST方法以支持更复杂的环境变量测试
export async function POST(request: Request) {
  try {
    // 从请求体中获取要测试的特定环境变量
    const { testVars } = await request.json();
    
    if (!testVars || !Array.isArray(testVars)) {
      return NextResponse.json(
        {
          success: false,
          message: '请求体中必须包含testVars数组'
        },
        {
          status: 400
        }
      );
    }

    // 测试指定的环境变量
    const testResults = testVars.map(varName => ({
      key: varName,
      exists: !!process.env[varName],
      isPublic: varName.startsWith('NEXT_PUBLIC_')
    }));

    return NextResponse.json({
      success: true,
      message: '环境变量测试完成',
      testResults: testResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('POST请求处理错误:', error);
    return NextResponse.json(
      {
        success: false,
        message: '处理POST请求时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      },
      {
        status: 500
      }
    );
  }
}