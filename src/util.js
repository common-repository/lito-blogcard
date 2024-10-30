// URLからドメイン名のみを取得
export const getDomainFromUrl = (url) => {
  if (isValidUrl(url)) {
    const origin = new URL(url).origin;
    const replaced = origin.replace(/https?:\/\//i, '').replace(/\/$/, '');

    return replaced;
  }
};

// URLの形式チェック
export const isValidUrl = (string) => {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

// // ファビコンを取得するURL
// export const faviconUrl = (url) => {
//   return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=16`
// }
