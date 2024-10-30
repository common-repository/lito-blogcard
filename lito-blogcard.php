<?php
/*
Plugin Name: LitoBlocks Blogcard
Plugin URI: https://e-joint.jp/works/blogcard-for-wp
Description: URLを貼るだけで、ブログカード風のリンクが作れるGutenbergブロックです。
Version:     1.0.2
Author:      Takashi Fujisaki
Author URI:  https://e-joint.jp
License:     GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: lito-blogcard
*/

/*
WP Blogcard is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

WP Blogcard is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with WP Blogcard. If not, see https://www.gnu.org/licenses/gpl-2.0.html.
*/

namespace LITOBC;

if (!defined('ABSPATH')) exit; // Exit if accessed directly

include_once plugin_dir_path(__FILE__) . 'inc/return_json.php';

use LITOBC\Content;

function init() {
  register_block_type(__DIR__ . '/build');
}
add_action('init', __NAMESPACE__ . '\\init');

/**
 * Set Categories
 *
 * @param array $categories Categories.
 * @param array $post Post.
 */
function set_category($categories, $post) {
  // 追加しようとしているカテゴリーのスラッグ
  $new_category_slug = 'lito-blocks';

  // 既存のカテゴリーに追加しようとしているスラッグが存在するかチェック
  foreach ($categories as $category) {
    if ($category['slug'] === $new_category_slug) {
      // 既に存在する場合は、何も追加せずに$categoriesをそのまま返す
      return $categories;
    }
  }

  // 既存のカテゴリーにない場合のみ新しいカテゴリーを追加
  $categories[] = [
    'slug' => $new_category_slug, // ブロックカテゴリーのスラッグ
    'title' => 'LitoBlocks', // ブロックカテゴリーの表示名
    // 'icon'  => 'wordpress',    //アイコンの指定（Dashicons名）.
  ];

  return $categories;
}
add_filter('block_categories_all', __NAMESPACE__ . '\\set_category', 10, 2);


function block_enqueue() {
  /**
   * PHPで生成した値をJavaScriptに渡す
   *
   * 第1引数: 渡したいJavaScriptの名前（wp_enqueue_scriptの第1引数に書いたもの）
   * 第2引数: JavaScript内でのオブジェクト名
   * 第3引数: 渡したい値の配列
   */
  wp_localize_script('lito-blogcard-editor-script', 'LITOBC', [
    'api' => admin_url('admin-ajax.php'),
    'action' => 'litobc-action',
    'nonce' => wp_create_nonce('litobc-ajax'),
    'actionRemoveCache' => 'litobc-action-remove-cache', // cache削除用
    'nonceRemoveCache' => wp_create_nonce('litobc-ajax-remove-cache'), // cache削除用
    'actionHasCache' => 'litobc-action-has-cache', // cache存在チェック用
    'nonceHasCache' => wp_create_nonce('litobc-ajax-has-cache'), // cache存在チェック用
  ]);
}
add_action('enqueue_block_editor_assets', __NAMESPACE__ . '\\block_enqueue');

/**
 * Ajaxで返すもの
 */
function ajax_get_content() {
  if (wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'litobc-ajax')) {
    $attr = [];
    $attr['postId'] = isset($_POST['postId']) ? intval($_POST['postId']) : null;
    $attr['url'] = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';

    // キャッシュ機能を有効にするには第2引数をtrue
    $json = Content\results($attr, true);

    // Content-Typeをapplication/jsonに設定して、クライアントにJSON形式であることを伝える
    header('Content-Type: application/json; charset=utf-8');
    echo wp_json_encode($json);

    wp_die();
  } else {
    // nonceの検証に失敗した場合、適切なHTTPステータスコードとメッセージを返す
    status_header(403); // Forbidden
    echo wp_json_encode(['error' => 'Nonce verification failed']);
    wp_die();
  }
}
add_action('wp_ajax_litobc-action', __NAMESPACE__ . '\\ajax_get_content');

function ajax_remove_cache() {
  if (wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'litobc-ajax-remove-cache')) {
    $transient_name = transient_name(esc_url_raw($_POST['url']));

    // トランジェントの削除を試みる
    if (delete_transient($transient_name)) {
      // 成功した場合のレスポンス
      echo wp_json_encode(['success' => true, 'message' => 'キャッシュを削除しました']);
    } else {
      // 失敗した場合のレスポンス
      echo wp_json_encode(['success' => false, 'message' => '']);
    }

    wp_die();
  }
}
add_action('wp_ajax_litobc-action-remove-cache', __NAMESPACE__ . '\\ajax_remove_cache');

/**
 * wp-optionsに保存するcacheにつけるoption_name
 * @param string $url
 */
function transient_name($url) {
  return 'litobc--' . rawurlencode($url);
}
