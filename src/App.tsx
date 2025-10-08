import { useState } from "react";

// 类型定义
interface ShortLinkResult {
  type: "success";
  shortUrl: string;
}

interface DouyinResult {
  type: "success";
  videoUrl: string;
  title?: string;
}

interface ErrorResult {
  type: "error";
  message: string;
}

type Result = ShortLinkResult | DouyinResult | ErrorResult | null;

// 结果显示组件
const ResultDisplay = ({ result }: { result: Result }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>("");

  if (!result) return null;

  const handleVideoDownload = async (videoUrl: string) => {
    setIsDownloading(true);
    setDownloadStatus("");

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      // 方法1: 通过后端代理下载（最可靠）
      if (apiUrl) {
        try {
          setDownloadStatus("通过服务器代理下载中...");
          const response = await fetch(`${apiUrl}/download_video`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url: videoUrl }),
          });

          if (response.ok) {
            setDownloadStatus("处理视频文件中...");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `douyin_video_${Date.now()}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            setDownloadStatus("下载成功！");
            return;
          }
        } catch {
          setDownloadStatus("服务器代理失败，尝试其他方案...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 方法2: 通过fetch绕过防盗链
      try {
        setDownloadStatus("直接下载中...");
        const response = await fetch(videoUrl, {
          mode: "cors",
          headers: {
            Referer: "https://www.douyin.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (response.ok) {
          setDownloadStatus("处理视频文件中...");
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `douyin_video_${Date.now()}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          setDownloadStatus("下载成功！");
          return;
        }
      } catch {
        setDownloadStatus("直接下载失败，尝试备用方案...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 方法3: 直接链接下载（可能遇到403）
      try {
        setDownloadStatus("尝试直接链接下载...");
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `douyin_video_${Date.now()}.mp4`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadStatus("如果没有开始下载，可能被防盗链阻止");
      } catch {
        // 方法4: 提供用户备选方案
        setDownloadStatus("");
        const confirmed = confirm(
          "所有下载方式都失败了，可能是防盗链限制。\n\n" +
            "请选择：\n" +
            "确定 - 复制链接，手动下载\n" +
            "取消 - 在新窗口打开视频",
        );

        if (confirmed) {
          await copyToClipboard(videoUrl);
          alert(
            "视频链接已复制到剪贴板！\n\n建议使用以下方式下载：\n1. 使用IDM等下载工具\n2. 使用浏览器扩展\n3. 手动右键保存\n4. 联系开发者添加后端代理支持",
          );
          setDownloadStatus("链接已复制到剪贴板");
        } else {
          window.open(videoUrl, "_blank", "noopener,noreferrer");
          setDownloadStatus("已在新窗口打开视频");
        }
      }
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadStatus(""), 3000);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
      // 降级方案
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("已复制到剪贴板");
    }
  };

  if (result.type === "error") {
    return (
      <div className="mt-6 p-4 rounded-lg bg-red-900 border border-red-700">
        <p className="text-center text-red-100">出错了: {result.message}</p>
      </div>
    );
  }

  if (result.type === "success" && "shortUrl" in result) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-green-900 border border-green-700">
        <p className="text-center text-green-100 mb-3">成功！短链接:</p>
        <div className="flex flex-col gap-2">
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-center break-all"
          >
            {result.shortUrl}
          </a>
          <button
            onClick={() => copyToClipboard(result.shortUrl)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded transition-colors"
          >
            复制链接
          </button>
        </div>
      </div>
    );
  }

  if (result.type === "success" && "videoUrl" in result) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-green-900 border border-green-700">
        <p className="text-center text-green-100 mb-3">解析成功！</p>
        {result.title && (
          <p className="text-center text-gray-300 mb-3 text-sm">
            {result.title}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <a
            href={result.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-center"
          >
            在新窗口中查看
          </a>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleVideoDownload(result.videoUrl)}
                disabled={isDownloading}
                className={`flex-1 text-white text-sm py-2 px-3 rounded transition-colors ${
                  isDownloading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isDownloading ? "下载中..." : "下载视频"}
              </button>
              <button
                onClick={() => copyToClipboard(result.videoUrl)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded transition-colors"
              >
                复制链接
              </button>
            </div>
            {downloadStatus && (
              <div className="text-center text-sm text-blue-300 bg-blue-900/30 p-2 rounded">
                {downloadStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// 短链接生成器组件
const ShortLinkGenerator = () => {
  const [longUrl, setLongUrl] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: longUrl }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw data;
      }

      const fullShortUrl = new URL(data.short_url, apiUrl).href;
      setResult({
        type: "success",
        shortUrl: fullShortUrl,
      });
    } catch (error) {
      console.error(error);
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-center mb-6">短链接生成器</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          placeholder="请输入你的长链接..."
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? "生成中..." : "生成短链接"}
        </button>
      </form>
      <ResultDisplay result={result} />
    </>
  );
};

// 抖音链接解析器组件
const DouyinParser = () => {
  const [douyinUrl, setDouyinUrl] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/douyin_parse`
    : "/douyin_parse";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_string: douyinUrl }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw data;
      }

      setResult({
        type: "success",
        videoUrl: data.video_url,
        title: data.title || undefined,
      });
    } catch (error) {
      console.error(error);
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "解析失败",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-center mb-6">抖音链接解析</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={douyinUrl}
          onChange={(e) => setDouyinUrl(e.target.value)}
          placeholder="请输入抖音分享链接..."
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? "解析中..." : "解析链接"}
        </button>
      </form>
      <ResultDisplay result={result} />
    </>
  );
};

function App() {
  const [activeTool, setActiveTool] = useState("douyin");

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-gray-800 rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTool("shortlink")}
            className={`px-4 py-2 text-lg font-medium cursor-pointer ${activeTool === "shortlink" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
          >
            短链接生成
          </button>
          <button
            onClick={() => setActiveTool("douyin")}
            className={`px-4 py-2 text-lg font-medium cursor-pointer ${activeTool === "douyin" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400"}`}
          >
            抖音解析
          </button>
        </div>

        {activeTool === "shortlink" && <ShortLinkGenerator />}
        {activeTool === "douyin" && <DouyinParser />}
      </div>
      <footer className="text-center text-gray-500 mt-8">
        <p>Powered by Gemini</p>
      </footer>
    </div>
  );
}

export default App;
