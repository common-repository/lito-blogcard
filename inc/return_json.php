<?php

namespace LITOBC\Content;

if (!defined('ABSPATH')) exit; // Exit if accessed directly

use LITOBC;

/**
 * リンクのブログカードのコンテンツ部分
 */
function results($attr, $transient = true) {
  $post_id = isset($attr['postId']) ? $attr['postId'] : null;

  // データベースのwp-optionsに登録されるoption_name
  $transient_name = LITOBC\transient_name($attr['url']);

  // リンクデータのcacheがある場合、cacheを返却
  if ($transient === true) {
    if (false !== ($cache = get_transient($transient_name))) {
      // cacheが使われてる場合は{cached:true}を返却
      $cache['hasCache'] = true;
      // 配列で保存されているのでJSONに変換
      return $cache;
    }
  }

  // サイトのHTMLを全部取得
  $results = wp_remote_get($attr['url']);
  $html = $results['body'];

  // UTF-8に変換
  $html = convert_encoding($html);

  // DOMXPathを作成
  $doc = new \DOMDocument();
  @$doc->loadHTML($html);
  $xpath = new \DOMXPath($doc);

  // すべてのOGPを取得
  $webpage_info = get_webpage_info($xpath);

  /////////////////////////////////////////////////////

  // タイトルを取得

  /////////////////////////////////////////////////////

  $title = $post_id ? get_the_title($post_id) : $webpage_info['title'];

  /////////////////////////////////////////////////////

  // descriptionを取得

  /////////////////////////////////////////////////////

  if ($post_id) {
    $description = get_the_excerpt($post_id);
  } else {
    $description = $webpage_info['description'];
    $description =
      mb_strlen($description) > 100 ? mb_substr($description, 0, 100) . '...' : $description;
  }

  /////////////////////////////////////////////////////

  // サムネイルURLを取得

  /////////////////////////////////////////////////////

  if ($post_id && has_post_thumbnail($post_id)) {
    // 自サイトの場合はアイキャッチを表示
    $thumbnailUrl = get_the_post_thumbnail_url($post_id, 'thumbnail');
  } elseif (isset($webpage_info['image']) && url_exists($webpage_info['image'])) {
    $thumbnailUrl = $webpage_info['image'];
  }

  /////////////////////////////////////////////////////

  // Faviconを取得

  /////////////////////////////////////////////////////

  $faviconUrl = get_favicon_url($xpath, $attr['url']);

  /////////////////////////////////////////////////////

  // JSONを返す

  /////////////////////////////////////////////////////

  if (url_exists($attr['url']) !== false) {
    // URLが存在する場合
    // $return_arr = [
    //   'title' => $title,
    //   'description' => $description,
    //   'favicon' => $favicon,
    //   'postId' => $post_id,
    // ];

    $return_arr = [];
    // タイトルがnullでも空文字でもない場合に追加
    if (!empty($title)) $return_arr['title'] = $title;
    if (!empty($description)) $return_arr['description'] = $description;
    if (!empty($post_id)) $return_arr['postId'] = $post_id;
    if (!empty($thumbnailUrl)) $return_arr['thumbnailUrl'] = $thumbnailUrl;
    if (!empty($faviconUrl)) $return_arr['faviconUrl'] = $faviconUrl;

    // wp-optionにキャッシュを保存
    if ($transient) {
      // 30日保存
      set_transient($transient_name, $return_arr, 60 * 60 * 24 * 30);
    }
  } else {
    $return_arr = [];
  }

  return $return_arr;
}

function get_webpage_info($xpath) {
  // タイトルの取得
  $title_results = $xpath->query("//title");
  $final_title = ''; // 最終的なタイトル
  if ($title_results->length > 0 && !empty(trim($title_results->item(0)->textContent))) {
    $final_title = trim($title_results->item(0)->textContent);
  } else {
    // og:titleの取得
    $og_title_results = $xpath->query("//meta[@property='og:title']");
    if ($og_title_results->length > 0) {
      $final_title = $og_title_results->item(0)->getAttribute('content');
    }
  }

  // ディスクリプションの取得
  $description_results = $xpath->query("//meta[@name='description']");
  $final_description = ''; // 最終的なディスクリプション
  if ($description_results->length > 0 && !empty(trim($description_results->item(0)->getAttribute('content')))) {
    $final_description = trim($description_results->item(0)->getAttribute('content'));
  } else {
    // og:descriptionの取得
    $og_description_results = $xpath->query("//meta[@property='og:description']");
    if ($og_description_results->length > 0) {
      $final_description = $og_description_results->item(0)->getAttribute('content');
    }
  }

  // OGPイメージの取得
  $og_image_results = $xpath->query("//meta[@property='og:image']");
  $og_image = ''; // 最終的なOGPイメージ
  if ($og_image_results->length > 0) {
    $og_image = $og_image_results->item(0)->getAttribute('content');
  }

  return [
    'title' => $final_title,
    'description' => $final_description,
    'image' => $og_image,
  ];
}



/**
 * URLが存在するかチェック
 */
function url_exists($url) {
  if (empty($url)) {
    return false; // URLが空の場合は早期リターン
  }
  $headers = get_final_headers($url);

  if ($headers) {
    return $headers['last-status'];
  }
}

/**
 * リダイレクト先もケアしてくれるget_header
 *
 * http://exe.tyo.ro/2010/04/phpget_headers.html
 */
function get_final_headers($url) {
  if (empty($url)) {
    return []; // URLが空の場合は空の配列を返して早期リターン
  }
  $headers = @get_headers($url);
  if (!$headers) {
    return [];
  }
  $res = [];
  $c = -1;
  foreach ($headers as $h) {
    if (strpos($h, 'HTTP/') === 0) {
      $res[++$c]['status-line'] = $h;
      $res[$c]['status-code'] = (int) strstr($h, ' ');
    } else {
      $sep = strpos($h, ': ');
      $res[$c][strtolower(substr($h, 0, $sep))] = substr($h, $sep + 2);
    }
  }
  $res['count'] = $c;
  $res['last-status'] = $res[$c]['status-code'];
  return $res;
}


/**
 * Faviconを取得
 */
function get_favicon_url($xpath, $base_url) {
  $favicon_url = null; // 変数名をfavicon_pathからfavicon_urlに変更

  // ファビコンのURLを取得するクエリ
  $queries = [
    "//link[@rel='icon' and @type='image/svg+xml']",
    "//link[@rel='icon' and @type='image/png']",
    "//link[@rel='shortcut icon']",
    "//link[contains(@rel, 'icon')]",
    "//link[@rel='apple-touch-icon']",
    "//meta[@name='msapplication-TileImage']"
  ];

  foreach ($queries as $query) {
    $results = $xpath->query($query);
    foreach ($results as $item) {
      if ($item instanceof \DOMElement) {
        $attr = ($item->tagName == 'meta') ? 'content' : 'href';
        $temp_url = $item->getAttribute($attr); // 変数名をtemp_pathからtemp_urlに変更

        // URLを絶対URLに変換
        $temp_url = convert_to_absolute_url($temp_url, $base_url); // 関数名も変更

        // ファビコンのURLが有効かチェック
        if (check_favicon_exists($temp_url)) {
          return $temp_url;
        }
      }
    }
  }

  // ドメイン直下のファビコンを探す
  $default_favicons = [
    convert_to_absolute_url("/favicon.svg", $base_url),
    convert_to_absolute_url("/favicon.ico", $base_url)
  ];

  foreach ($default_favicons as $favicon_url) {
    if (check_favicon_exists($favicon_url)) {
      return $favicon_url;
    }
  }

  return null;
}

function convert_to_absolute_url($url, $base_url) {
  if (preg_match('/^https?:\/\//', $url)) {
    return $url;
  }

  $parts = parse_url($base_url);
  $scheme = $parts['scheme'];
  $host = $parts['host'];

  if (strpos($url, '/') === 0) {
    return "$scheme://$host$url";
  }

  $base_path = isset($parts['path']) ? dirname($parts['path']) : '';
  return "$scheme://$host" . rtrim($base_path, '/') . '/' . ltrim($url, '/');
}

function check_favicon_exists($url) {
  $headers = @get_headers($url, 1);
  return $headers && strpos($headers[0], '200 OK') !== false;
}

/**
 * 文字コードをUTF-8に変換
 */

function convert_encoding($string) {
  // 文字コードを調べる
  $source_encode = mb_detect_encoding($string, ['UTF-8', 'SJIS-win', 'eucJP-win']);

  if ($source_encode === 'UTF-8' || !$source_encode) {
    // UTF-8なら何もしない
    return $string;
  } else {
    // UTF-8じゃなければUTF-8にエンコードする
    return mb_convert_encoding($string, 'UTF-8', $source_encode);
  }
}
