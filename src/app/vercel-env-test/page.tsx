"use client";

import { useState, useEffect } from 'react';

// 服务器端获取环境变量状态的辅助函数
async function fetchEnvStatus() {
  try {
    // 使用我们的环境变量检查端点
    const response = await fetch('/api/check-env');
    if (!response.ok) {
      throw new Error('获取环境变量状态失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取环境变量状态时出错:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 直接测试关键服务是否能正常工作的函数
async function testCriticalServices() {
  const results = {
    dbConnectionTest: {
      success: false,
      message: ''
    },
    authServiceTest: {
      success: false,
      message: ''
    }
  };

  try {
    // 测试数据库连接是否配置正确
    const dbResponse = await fetch('/api/init');
    const dbResult = await dbResponse.json();
    results.dbConnectionTest = {
      success: dbResponse.ok && dbResult.success,
      message: dbResult.message || (dbResponse.ok ? '数据库连接测试成功' : '数据库连接测试失败')
    };
  } catch (error) {
    results.dbConnectionTest = {
      success: false,
      message: `数据库连接测试异常: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }

  try {
    // 测试认证服务配置
    const envCheckResponse = await fetch('/api/check-env');
    const envCheckResult = await envCheckResponse.json();
    
    if (envCheckResponse.ok) {
      const authConfigured = envCheckResult.featureChecks?.osuLogin?.isConfigured || false;
      results.authServiceTest = {
        success: authConfigured,
        message: authConfigured ? '认证服务配置正确' : '认证服务配置不完整'
      };
    } else {
      throw new Error('环境变量检查失败');
    }
  } catch (error) {
    results.authServiceTest = {
      success: false,
      message: `认证服务配置测试异常: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }

  return results;
}

export default function VercelEnvTestPage() {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEnvStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        // 并行获取环境变量状态和服务测试结果
        const [envResult, serviceResult] = await Promise.all([
          fetchEnvStatus(),
          testCriticalServices()
        ]);
        setEnvStatus(envResult);
        setServiceStatus(serviceResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取环境状态失败');
      } finally {
        setLoading(false);
      }
    };

    loadEnvStatus();
  }, []);

  // 刷新状态的函数
  const refreshStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [envResult, serviceResult] = await Promise.all([
        fetchEnvStatus(),
        testCriticalServices()
      ]);
      setEnvStatus(envResult);
      setServiceStatus(serviceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新环境状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染环境变量检查结果
  const renderEnvResults = () => {
    if (!envStatus || !envStatus.success) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-bold">环境变量检查失败</p>
          <p>{envStatus?.error || '无法获取环境变量状态'}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">部署环境信息</h3>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="font-medium">运行环境:</span> {process.env.VERCEL ? 'Vercel' : '本地/其他环境'}</p>
            <p><span className="font-medium">NODE_ENV:</span> {process.env.NODE_ENV}</p>
            <p><span className="font-medium">VERCEL_ENV:</span> {process.env.VERCEL_ENV || '未设置'}</p>
            <p><span className="font-medium">VERCEL_URL:</span> {process.env.VERCEL_URL}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">环境变量状态</h3>
          <div className="space-y-2">
            {Object.entries(envStatus.environmentVariables || {}).map(([key, status]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key}:</span>
                <span className={`font-medium ${status === '已设置' ? 'text-green-600' : 'text-red-600'}`}>{String(status)}</span>
              </div>
            ))}
          </div>
        </div>

        {envStatus.featureChecks?.osuLogin && !envStatus.featureChecks.osuLogin.isConfigured && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <h3 className="text-lg font-semibold mb-2">❌ OSU登录功能配置不完整:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {envStatus.featureChecks.osuLogin.issues.map((issue: string, index: number) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {envStatus.featureChecks?.nextAuth && !envStatus.featureChecks.nextAuth.isConfigured && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md text-orange-700">
            <h3 className="text-lg font-semibold mb-2">⚠️ NextAuth配置不完整:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {envStatus.featureChecks.nextAuth.issues.map((issue: string, index: number) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {(envStatus.featureChecks?.osuLogin?.isConfigured && envStatus.featureChecks?.nextAuth?.isConfigured) && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
            <h3 className="text-lg font-semibold mb-2">✅ 所有核心功能的环境变量都已正确设置!</h3>
          </div>
        )}

        {envStatus.recommendations && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">配置建议:</h3>
            <ul className="list-disc pl-5 space-y-2">
              {envStatus.recommendations.map((tip: string, index: number) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // 渲染服务测试结果
  const renderServiceResults = () => {
    if (!serviceStatus) {
      return null;
    }

    return (
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">服务连接测试</h2>
        
        <div className={`p-4 border rounded-md ${serviceStatus.dbConnectionTest.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <h3 className="text-lg font-semibold mb-2">{serviceStatus.dbConnectionTest.success ? '✅ 数据库连接' : '❌ 数据库连接'}</h3>
          <p>{serviceStatus.dbConnectionTest.message}</p>
        </div>

        <div className={`p-4 border rounded-md ${serviceStatus.authServiceTest.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <h3 className="text-lg font-semibold mb-2">{serviceStatus.authServiceTest.success ? '✅ 认证服务配置' : '❌ 认证服务配置'}</h3>
          <p>{serviceStatus.authServiceTest.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">Vercel 环境变量测试</h1>
            <p className="mt-1 text-sm text-gray-500">
              此页面帮助您验证 Vercel 部署环境中的环境变量配置状态
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500">上次检查时间: {!loading && new Date().toLocaleString()}</p>
              <button
                onClick={refreshStatus}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    检查中...
                  </span>
                ) : (
                  '刷新检查'
                )}
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                <p className="font-medium">错误: {error}</p>
                <p className="mt-1 text-sm">请稍后重试或联系开发人员</p>
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center">
                <svg className="animate-spin mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500">正在检查环境变量状态...</p>
              </div>
            ) : (
              <>
                {renderEnvResults()}
                {renderServiceResults()}
              </>
            )}
          </div>

          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <div className="mt-3 text-center sm:mt-0 sm:ml-3 sm:text-left">
            <p className="text-sm text-gray-500">
              如需帮助，请参考项目根目录下的 .env.example 文件查看所需的环境变量配置
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}