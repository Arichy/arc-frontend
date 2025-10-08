import { useState } from 'react';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 从环境变量中读取 API 地址
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 我们的 Rust 后端需要一个 'url' 字段
        body: JSON.stringify({ url: longUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // 将 API 返回的相对路径 /<id> 拼接成完整的 URL
      const fullShortUrl = new URL(data.short_url, apiUrl).href;
      setResult(
        `成功！短链接: <a href="${fullShortUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-600">${fullShortUrl}</a>`
      );
    } catch (error) {
      console.error(error);
      setResult(`出错了: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-center mb-6">短链接生成器</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={longUrl}
            onChange={e => setLongUrl(e.target.value)}
            placeholder="请输入你的长链接..."
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                生成中...
              </div>
            ) : (
              '生成短链接'
            )}
          </button>
        </form>
        {result && (
          <div
            className={`mt-6 p-4 rounded-lg text-center ${
              result.startsWith('出错了') ? 'bg-red-900 border border-red-700' : 'bg-green-900 border border-green-700'
            }`}
            dangerouslySetInnerHTML={{ __html: result }}
          />
        )}
      </div>
      <footer className="text-center text-gray-500 mt-8">
        <p>Powered by Gemini</p>
      </footer>
    </div>
  );
}

export default App;
