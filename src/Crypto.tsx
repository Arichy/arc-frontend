import { useState } from "react";
import {
  Textarea,
  Button,
  Paper,
  Group,
  Notification,
  Loader,
  CopyButton,
  Tooltip,
  ActionIcon,
  rem,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

const Crypto = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || "";

  const handleEncrypt = async () => {
    setIsLoading(true);
    setError(null);
    setResult("");

    try {
      const response = await fetch(`${apiUrl}/crypto/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Encryption failed");
      }

      setResult(data.encrypted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async () => {
    setIsLoading(true);
    setError(null);
    setResult("");

    try {
      const response = await fetch(`${apiUrl}/crypto/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Decryption failed");
      }

      setResult(data.decrypted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Textarea
        placeholder="Enter text to encrypt or decrypt"
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
        autosize
        minRows={4}
      />
      <Group style={{ marginTop: "1rem" }}>
        <Button onClick={handleEncrypt} disabled={isLoading}>
          Encrypt
        </Button>
        <Button onClick={handleDecrypt} disabled={isLoading}>
          Decrypt
        </Button>
      </Group>
      {isLoading && (
        <Group
          style={{ marginTop: "1rem", minHeight: rem(160) }}
          justify="center"
        >
          <Loader />
        </Group>
      )}
      {error && (
        <Notification color="red" title="Error" style={{ marginTop: "1rem" }}>
          {error}
        </Notification>
      )}
      {result && (
        <div
          style={{
            position: "relative",
            marginTop: "1rem",
            minHeight: rem(160),
          }}
        >
          <Textarea
            value={result}
            readOnly
            style={{ minHeight: rem(160), overflowY: "auto" }}
          />
          <CopyButton value={result} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip
                label={copied ? "Copied" : "Copy"}
                withArrow
                position="left"
              >
                <ActionIcon
                  color={copied ? "teal" : "gray"}
                  variant="subtle"
                  onClick={copy}
                  style={{ position: "absolute", top: rem(5), right: rem(5) }}
                >
                  {copied ? (
                    <IconCheck style={{ width: rem(16) }} />
                  ) : (
                    <IconCopy style={{ width: rem(16) }} />
                  )}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </div>
      )}
    </Paper>
  );
};

export default Crypto;
