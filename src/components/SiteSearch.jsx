import { useState, useEffect, useContext } from '@wordpress/element';
import { SearchControl } from '@wordpress/components';
import debounce from 'lodash.debounce';
import { isValidUrl } from '../util';
import { SharedContext } from '../libs/contextProvider';

export default function SiteSearch({ attributes, setAttributes }) {
  const api = LITOBC.api;
  const { url, title } = attributes;
  const [searchPostResults, setSearchPostResults] = useState([]);
  const [searchPageResults, setSearchPageResults] = useState([]);

  const [showPopover, setShowPopover] = useState(false);
  const { setHasCache, searchQuery, setSearchQuery, setState } = useContext(SharedContext);

  const performSearch = async (query) => {
    try {
      // 各エンドポイントからのレスポンスを並行して取得
      const [postsResponse, pagesResponse] = await Promise.all([
        fetch(`/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}`),
        fetch(`/wp-json/wp/v2/pages?search=${encodeURIComponent(query)}`),
      ]);

      // 各レスポンスからJSONを取得
      const posts = await postsResponse.json();
      const pages = await pagesResponse.json();
      // const customPosts = await customTypeResponse.json();

      // 結果を統合
      // const combinedResults = [...posts, ...pages, ...customPosts];
      const combinedResults = [...posts, ...pages];

      // 結果を設定
      setSearchPostResults(posts);
      setSearchPageResults(pages);
      setShowPopover(combinedResults.length > 0);
    } catch (error) {
      console.error('エラーが発生しました:', error);
    }
  };

  const fetchData = async (url, postId) => {
    const params = new URLSearchParams();
    params.append('action', LITOBC.action);
    params.append('nonce', LITOBC.nonce);
    params.append('url', url);

    if (postId) params.append('postId', postId);

    try {
      const res = await fetch(api, { method: 'post', body: params });
      const getJson = await res.json();

      // デフォルト値を設定
      await setDefault();

      // キャッシュが存在する場合
      if (getJson.hasCache) {
        setHasCache(true);
      }

      // await setAttributes({ json: getJson });
      await setAttributes({
        title: getJson.title,
        description: getJson.description,
        postId: getJson.postId,
        thumbnailUrl: getJson.thumbnailUrl,
        faviconUrl: getJson.faviconUrl,
      });
    } catch (e) {
      setState('fetch-error');
      console.error(e);
    }
  };

  const isExternalLink = (url) => {
    const reg = new RegExp('^(https?:)?//' + location.hostname);

    return !(url.match(reg) || url.charAt(0) === '/');
  };

  // URLが入力されたときの初期設定
  const setDefault = () => {
    if (isExternalLink(url)) {
      setAttributes({
        nofollow: true,
        noreferrer: true,
      });
    }
  };

  // デバウンスされた検索関数
  const debouncedSearch = debounce((query) => {
    // 検索文字数を指定できる 現状0にしておく
    if (query.length > 0) {
      performSearch(query);
    } else {
      setSearchPostResults([]);
      setShowPopover(false);
    }
  }, 300);

  // Enterを押したら
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // 前のURLと同じなら何もしない
      if (searchQuery === url) {
        return;
      }

      // 検索バーが空なら何もしない
      if (searchQuery === '') {
        setState('url-empty');
        return false;
      }

      // URLの形式ならURLを登録する（検索がはじまる）
      if (isValidUrl(searchQuery)) {
        setAttributes({ url: searchQuery });
        fetchData(searchQuery);
        // 検索モード
        setState('search');
      }
    }
  };

  // サイト内検索の結果をクリックしたら
  const handleClickResult = (value) => {
    setAttributes({ url: value.link });
    setSearchQuery(value.link);
    fetchData(value.link, value.id);
    setState('search');
    setShowPopover(false);
  };

  // 入力の変更を監視
  useEffect(() => {
    debouncedSearch(searchQuery);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);

  // jsonに変更があったらstateを変更する
  useEffect(() => {
    if (title.length > 0) {
      setState('data-success');
    }
  }, [title]);

  return (
    <div className="litobc-search">
      <SearchControl
        className="litobc-search-bar"
        label="検索"
        placeholder="URLを入力してEnter / サイト内検索の場合はキーワードを入力"
        value={searchQuery}
        onChange={(value) => setSearchQuery(value)}
        onKeyDown={handleKeyDown}
      />
      {showPopover && !isValidUrl(searchQuery) && (
        <div className="litobc-search-results">
          {searchPostResults.length > 0 && (
            <div className="litobc-search-results-item">
              <p>投稿</p>
              <ul>
                {searchPostResults.map((post) => (
                  <li key={post.id} onClick={() => handleClickResult(post)}>
                    <span className="litobc-search-results-title">{post.title.rendered}</span>
                    <span className="litobc-search-results-url">{post.link}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {searchPageResults.length > 0 && (
            <div className="litobc-search-results-item">
              <p>固定ページ</p>
              <ul>
                {searchPageResults.map((post) => (
                  <li key={post.id} onClick={() => handleClickResult(post)}>
                    <span className="litobc-search-results-title">{post.title.rendered}</span>
                    <span className="litobc-search-results-url">{post.link}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
