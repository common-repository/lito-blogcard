import { useState, useEffect } from '@wordpress/element';
import {
  BaseControl,
  Button,
  PanelBody,
  SelectControl,
  TextControl,
  ToggleControl,
} from '@wordpress/components';
import { InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

export default function Controls({ attributes, setAttributes }) {
  const api = LITOBC.api;

  const {
    url,
    target,
    nofollow,
    noopener,
    noreferrer,
    sponsored,
    ugc,
    thumbnail,
    title,
    description,
    thumbnailUrl,
  } = attributes;

  const [clearText, setClearText] = useState(''); // キャッシュをクリアしたときのメッセージ

  const removeCache = async () => {
    const params = new URLSearchParams();
    params.append('action', LITOBC.actionRemoveCache);
    params.append('nonce', LITOBC.nonceRemoveCache);
    params.append('url', url);

    const res = await fetch(api, { method: 'post', body: params });
    const json = await res.json();
    if (json.success) setClearText(json.message);
  };

  const DefaultImageButton = () => {
    if (thumbnailUrl) {
      return <img src={thumbnailUrl} alt="" />;
    } else {
      return <span>サムネイルをを設定</span>;
    }
  };

  useEffect(() => {
    if (target !== '') setAttributes({ noopener: true });
  }, [target]);

  return (
    <InspectorControls>
      <PanelBody
        title={'ブロック設定'}
        className="su-components-panel__body su-components-panel__body--litobc"
      >
        <SelectControl
          label="target属性"
          value={target}
          onChange={(value) => setAttributes({ target: value })}
          options={[
            { value: '', label: 'なし' },
            { value: '_blank', label: '_blank (別ウインドウ・タブ)' },
            { value: '_new', label: '_new (ひとつの別ウインドウ・タブ)' },
            { value: '_self', label: '_self (同じウインドウ・タブ)' },
          ]}
        />

        <ToggleControl
          label="noopener を追加"
          help="target属性があれば強制的に有効になります"
          checked={noopener}
          disabled={target !== ''}
          onChange={(value) => setAttributes({ noopener: target === '' ? value : true })}
        />
        <ToggleControl
          label="rel=nofollow を追加"
          help=""
          checked={nofollow}
          onChange={(value) => setAttributes({ nofollow: value })}
        />
        <ToggleControl
          label="rel=noreferrer を追加"
          help=""
          checked={noreferrer}
          onChange={(value) => setAttributes({ noreferrer: value })}
        />
        <ToggleControl
          label="rel=sponsored を追加"
          help=""
          checked={sponsored}
          onChange={(value) => setAttributes({ sponsored: value })}
        />
        <ToggleControl
          label="rel=ugc を追加"
          help=""
          checked={ugc}
          onChange={(value) => setAttributes({ ugc: value })}
        />

        <ToggleControl
          label="サムネイルを表示しない"
          help=""
          checked={thumbnail}
          onChange={(value) => {
            setAttributes({ thumbnail: value });
          }}
        />

        <BaseControl label="キャッシュを削除">
          <div className="cached-btn">
            <Button className="components-button is-secondary" onClick={removeCache}>
              キャッシュを削除
            </Button>
          </div>
          {clearText && <div className="mt-1">{clearText}</div>}
        </BaseControl>

        <TextControl
          label="タイトルを手動で入力"
          value={title}
          onChange={(value) => {
            setAttributes({ title: value });
          }}
        />
        <TextControl
          label="説明文を手動で入力"
          value={description}
          onChange={(value) => {
            setAttributes({ description: value });
          }}
        />

        <BaseControl label="サムネイルを手動で設定">
          <MediaUploadCheck>
            <MediaUpload
              onSelect={(value) => {
                setAttributes({
                  thumbnailId: value.id,
                  thumbnailUrl: value.url,
                });
              }}
              allowedTypes={['image']}
              value={thumbnailUrl}
              render={({ open }) => (
                <Button onClick={open} className="editor-post-featured-image__toggle">
                  <DefaultImageButton />
                </Button>
              )}
            />
          </MediaUploadCheck>

          <Button
            style={{ marginTop: '0.5rem' }}
            className="is-tertiary"
            onClick={() => {
              setAttributes({ thumbnailUrl: '' });
            }}
          >
            クリア
          </Button>
        </BaseControl>
      </PanelBody>
    </InspectorControls>
  );
}
