import { useState } from "react";
import {
  Tabs,
  TextInput,
  Button,
  Paper,
  Text,
  Notification,
  CopyButton,
  rem,
  Group,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import Crypto from "./Crypto";

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
    <Paper withBorder p="md" radius="md">
      <form onSubmit={handleSubmit}>
        <Group>
          <TextInput
            style={{ flex: 1 }}
            value={longUrl}
            onChange={(e) => setLongUrl(e.currentTarget.value)}
            placeholder="请输入你的长链接..."
            required
          />
          <Button type="submit" loading={isLoading}>
            {isLoading ? "生成中..." : "生成短链接"}
          </Button>
        </Group>
      </form>
      {result && (
        <div style={{ marginTop: rem(20) }}>
          {result.type === "error" && (
            <Notification color="red" title="出错了">
              {result.message}
            </Notification>
          )}
          {result.type === "success" && "shortUrl" in result && (
            <Notification color="green" title="成功！短链接:">
              <Group>
                <Text>{result.shortUrl}</Text>
                <CopyButton value={result.shortUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                      <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                        {copied ? (
                          <IconCheck style={{ width: rem(16) }} />
                        ) : (
                          <IconCopy style={{ width: rem(16) }} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Notification>
          )}
        </div>
      )}
    </Paper>
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
    <Paper withBorder p="md" radius="md">
      <form onSubmit={handleSubmit}>
        <Group>
          <TextInput
            style={{ flex: 1 }}
            value={douyinUrl}
            onChange={(e) => setDouyinUrl(e.currentTarget.value)}
            placeholder="请输入抖音分享链接..."
            required
          />
          <Button type="submit" loading={isLoading}>
            {isLoading ? "解析中..." : "解析链接"}
          </Button>
        </Group>
      </form>
      {result && (
        <div style={{ marginTop: rem(20) }}>
          {result.type === "error" && (
            <Notification color="red" title="出错了">
              {result.message}
            </Notification>
          )}
          {result.type === "success" && "videoUrl" in result && (
            <Notification color="green" title="解析成功！">
              {result.title && <Text>{result.title}</Text>}
              <Group>
                <a href={result.videoUrl} target="_blank" rel="noopener noreferrer">
                  在新窗口中查看
                </a>
                <CopyButton value={result.videoUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                      <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                        {copied ? (
                          <IconCheck style={{ width: rem(16) }} />
                        ) : (
                          <IconCopy style={{ width: rem(16) }} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Notification>
          )}
        </div>
      )}
    </Paper>
  );
};

function App() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper withBorder p="md" radius="md" style={{ width: '80%', maxWidth: rem(800) }}>
        <Tabs defaultValue="crypto">
          <Tabs.List>
            <Tabs.Tab value="crypto">
              文本加密/解密
            </Tabs.Tab>
            <Tabs.Tab value="shortlink">
              短链接生成
            </Tabs.Tab>
            <Tabs.Tab value="douyin">
              抖音解析
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="crypto" pt="xs">
            <Crypto />
          </Tabs.Panel>

          <Tabs.Panel value="shortlink" pt="xs">
            <ShortLinkGenerator />
          </Tabs.Panel>

          <Tabs.Panel value="douyin" pt="xs">
            <DouyinParser />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </div>
  );
}

export default App;
