import EnvironmentChecker from '../components/EnvironmentChecker';

// 环境变量检查专用页面
const EnvCheckPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            环境变量检查器
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            检查您的应用程序环境变量配置状态
          </p>
        </header>
        
        <main className="mt-8">
          <EnvironmentChecker />
        </main>
        
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>此工具仅用于开发和调试目的，请勿在生产环境中暴露敏感信息</p>
          <p className="mt-2">访问 <code className="bg-gray-100 px-1 py-0.5 rounded">/api/env-check</code> 获取原始数据</p>
        </footer>
      </div>
    </div>
  );
};

export default EnvCheckPage;