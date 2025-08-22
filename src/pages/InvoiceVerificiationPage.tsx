// src/pages/InvoiceVerificationPage.tsx
import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

type VerifyState = "idle" | "loading" | "valid" | "invalid" | "error";

/* === Replace with your actual public key PEM if you want to prefill it === */
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBmwzRK+zrjJL91otNTsnD1uu9
fXMgUugSqdVmdC2mlcp1ZWUYRbVW6THv2tuLDwP57PWLrbZi3f8h01+qnTzZQ2Xn
gLbWgpt20uHwhv2uw/V4uFEBXLSEfhYcRC7mBx6RPUF8K2bThfA43HzOdYSr7RJH
bBm/NQ4mnJ3dLtDCtQIDAQAB
-----END PUBLIC KEY-----`;

/* Helpers */
function base64UrlToUint8Array(base64Url: string) {
  const b64 =
    base64Url.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (base64Url.length % 4)) % 4);
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pemToArrayBuffer(pem: string) {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\r?\n|\r/g, "")
    .trim();
  return base64UrlToUint8Array(b64).buffer;
}

async function importRsaPublicKey(spkiPem: string) {
  const ab = pemToArrayBuffer(spkiPem);
  return await crypto.subtle.importKey(
    "spki",
    ab,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["verify"]
  );
}

async function verifySignature(
  publicKey: CryptoKey,
  data: Uint8Array,
  signature: Uint8Array
) {
  return await crypto.subtle.verify(
    {
      name: "RSASSA-PKCS1-v1_5",
    },
    publicKey,
    signature,
    data
  );
}

/* UI Component */
const InvoiceVerificationPage: React.FC = () => {
  const [status, setStatus] = useState<VerifyState>("idle");
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [sigParam, setSigParam] = useState<string | null>(null);
  const [dataParam, setDataParam] = useState<string | null>(null);
  const [payloadText, setPayloadText] = useState<string | null>(null);
  const [publicKeyPem, setPublicKeyPem] = useState<string>(
    PUBLIC_KEY_PEM || ""
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copiedHint, setCopiedHint] = useState<string | null>(null);

  // Extract params once on mount - no server calls
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("invoiceId");
    const sig = params.get("sig") || params.get("signature");
    const data = params.get("data"); // optional: base64url-encoded payload
    const pub = params.get("pub"); // optional: PEM urlencoded

    setInvoiceId(id);
    setSigParam(sig);
    setDataParam(data);
    if (pub) {
      try {
        setPublicKeyPem(decodeURIComponent(pub));
      } catch {
        setPublicKeyPem(pub);
      }
    }
  }, []);

  // Auto-run verify only when we have all three pieces: sig + data + publicKeyPem
  useEffect(() => {
    const run = async () => {
      if (!sigParam) {
        setStatus("idle");
        return;
      }
      if (!dataParam || !publicKeyPem?.trim()) {
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setErrorText(null);

      try {
        const bytes = base64UrlToUint8Array(dataParam);
        const payloadString = new TextDecoder().decode(bytes);
        setPayloadText(payloadString);

        const sigBytes = base64UrlToUint8Array(sigParam);
        const pubKey = await importRsaPublicKey(publicKeyPem);
        const dataBytes = new TextEncoder().encode(payloadString);
        const ok = await verifySignature(pubKey, dataBytes, sigBytes);
        setStatus(ok ? "valid" : "invalid");
      } catch (err: any) {
        console.error(err);
        setErrorText(String(err?.message || err));
        setStatus("error");
      }
    };

    run();
  }, [sigParam, dataParam, publicKeyPem]);

  const doManualVerify = async () => {
    if (!sigParam) {
      setErrorText("No signature provided in URL (sig parameter).");
      setStatus("error");
      return;
    }
    if (!publicKeyPem?.trim()) {
      setErrorText("Please paste the public key (PEM) above.");
      setStatus("error");
      return;
    }
    if (!payloadText) {
      setErrorText("Please paste or provide the invoice payload to verify.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorText(null);

    try {
      const sigBytes = base64UrlToUint8Array(sigParam);
      const pubKey = await importRsaPublicKey(publicKeyPem);
      const dataBytes = new TextEncoder().encode(payloadText);
      const ok = await verifySignature(pubKey, dataBytes, sigBytes);
      setStatus(ok ? "valid" : "invalid");
    } catch (err: any) {
      setErrorText(String(err?.message || err));
      setStatus("error");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHint("Copied!");
      setTimeout(() => setCopiedHint(null), 1800);
    } catch {
      setCopiedHint("Failed to copy");
      setTimeout(() => setCopiedHint(null), 1800);
    }
  };

  const renderStatusBlock = () => {
    if (status === "loading") {
      return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <CircularProgress size={20} />
          <Box>Verifying signature…</Box>
        </Box>
      );
    }
    if (status === "valid") {
      return (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            color: "success.main",
          }}
        >
          <CheckCircleIcon />
          <Box sx={{ fontWeight: 700 }}>
            Valid — signature matches public key
          </Box>
        </Box>
      );
    }
    if (status === "invalid") {
      return (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            color: "error.main",
          }}
        >
          <CancelIcon />
          <Box sx={{ fontWeight: 700 }}>Invalid — signature does NOT match</Box>
        </Box>
      );
    }
    if (status === "error") {
      return (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            color: "warning.main",
          }}
        >
          <CancelIcon />
          <Box sx={{ fontWeight: 700 }}>Error — {errorText}</Box>
        </Box>
      );
    }
    return <Box sx={{ color: "text.secondary" }}>Ready to verify.</Box>;
  };

  const signatureDisplay = sigParam
    ? sigParam
    : "— not provided in URL (sig=...)";
  const publicKeyDisplay = publicKeyPem
    ? publicKeyPem
    : "— paste public key PEM here";

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        bgcolor: "background.default",
        p: { xs: 2, md: 6 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 920,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Top notice / warning with logo */}
        <Box
          sx={{
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 1,
            boxShadow: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ color: "text.secondary", fontSize: "0.95rem", flex: 1 }}>
            This tool performs a quick, <strong>client-side</strong>{" "}
            verification in your browser using the signature and public key you
            provide. <strong>It does not contact our servers</strong> — do not
            treat this page as the authoritative source. Beware of fake copy
            sites: confirm you are visiting{" "}
            <strong>{window.location.origin}</strong>, and if you see anything
            suspicious contact us immediately.
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <Box
              component="a"
              href="mailto:akermiphone@gmail.com"
              sx={{ fontSize: "0.9rem" }}
            >
              ✉ akermiphone@gmail.com
            </Box>
            <Box
              component="a"
              href="tel:+213797408717"
              sx={{ fontSize: "0.9rem" }}
            >
              ☏ +213 797 408 717
            </Box>
          </Box>
        </Box>

        {/* Header / status */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ fontSize: "1.05rem", fontWeight: 700 }}>
              Invoice verification
            </Box>
            <Box sx={{ color: "text.secondary", fontSize: "0.9rem", mt: 0.5 }}>
              Quick browser-only check — details below.
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {renderStatusBlock()}
          </Box>
        </Box>

        {/* Card */}
        <Box
          sx={{
            bgcolor: "background.paper",
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            boxShadow: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ fontWeight: 700 }}>Invoice ID</Box>
            <Box sx={{ color: "text.secondary" }}>
              {invoiceId ?? "— not provided"}
            </Box>
          </Box>

          {/* Public key input */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ fontWeight: 700 }}>
              Public key (PEM) — required for verification
            </Box>
            <Box
              component="textarea"
              value={publicKeyPem}
              onChange={(e) => setPublicKeyPem(e.target.value)}
              placeholder="Paste the store public key (-----BEGIN PUBLIC KEY----- ...)"
              rows={4}
              style={{
                width: "100%",
                resize: "vertical",
                padding: 12,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => publicKeyPem && copyToClipboard(publicKeyPem)}
              >
                <ContentCopyIcon fontSize="small" /> Copy key
              </Button>
            </Box>
          </Box>

          {/* Payload / data */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ fontWeight: 700 }}>Payload (data)</Box>

            {payloadText ? (
              <Box
                component="pre"
                sx={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace",
                  fontSize: "0.85rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "text.primary",
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "background.default",
                }}
              >
                {payloadText}
              </Box>
            ) : (
              <Box sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                No payload available from the QR. If your QR didn't include the
                signed payload, paste the exact string that was signed in the
                box below, then press Verify.
              </Box>
            )}

            <Box
              component="textarea"
              value={payloadText ?? ""}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder="Paste the payload (exact string used when signing) here..."
              rows={4}
              style={{
                width: "100%",
                resize: "vertical",
                padding: 12,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" variant="contained" onClick={doManualVerify}>
                Verify
              </Button>
            </Box>
          </Box>

          {/* Signature / Public Key display */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontWeight: 700, mb: 0.5 }}>Signature (base64url)</Box>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "background.default",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.85rem",
                  wordBreak: "break-all",
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ flex: 1, mr: 1 }}>{signatureDisplay}</Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    signatureDisplay && copyToClipboard(signatureDisplay)
                  }
                >
                  <ContentCopyIcon fontSize="small" />
                </Button>
              </Box>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontWeight: 700, mb: 0.5 }}>Public key (PEM)</Box>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "background.default",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1 }}>{publicKeyDisplay}</Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    publicKeyDisplay && copyToClipboard(publicKeyDisplay)
                  }
                >
                  <ContentCopyIcon fontSize="small" />
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Extra guidance */}
          <Box sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            Important guidance:
            <Box component="span" sx={{ display: "block", mt: 0.5 }}>
              • This verification runs in your browser only. For authoritative
              validation, contact the store using the email/phone above.
            </Box>
            <Box component="span" sx={{ display: "block" }}>
              • Beware of copy sites that mimic our design — always confirm the
              domain shown in your browser and do not paste private keys
              anywhere.
            </Box>
            <Box component="span" sx={{ display: "block" }}>
              • The server should sign a canonical deterministic string
              (otherwise verification can fail due to formatting differences).
              If unsure, contact support and share the invoice ID and QR photo.
            </Box>
          </Box>

          {copiedHint && <Box sx={{ color: "success.main" }}>{copiedHint}</Box>}
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceVerificationPage;
