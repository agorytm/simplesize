/**
 * usePermalink — encode/decode formData + selectedTest dans l'URL (base64url)
 * Usage:
 *   const { copyPermalink, permalinkCopied } = usePermalink(formData, selectedTest);
 */
import { useEffect, useCallback, useState } from 'react';

function encode(obj) {
  try {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch { return null; }
}

function decode(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch { return null; }
}

export function encodeConfig(formData, selectedTest) {
  return encode({ ...formData, _test: selectedTest });
}

export function decodeConfig(hash) {
  return decode(hash);
}

export default function usePermalink(formData, selectedTest) {
  const [permalinkCopied, setPermalinkCopied] = useState(false);

  const copyPermalink = useCallback(() => {
    const encoded = encode({ ...formData, _test: selectedTest });
    if (!encoded) return;
    const url = `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setPermalinkCopied(true);
      setTimeout(() => setPermalinkCopied(false), 2500);
    });
  }, [formData, selectedTest]);

  return { copyPermalink, permalinkCopied };
}
