import { useContext } from '@wordpress/element';

import Blogcard from './Blogcard';
import { SharedContext } from '../libs/contextProvider';

export default function Result({ attributes }) {
  const { url } = attributes;
  const { hasCache } = useContext(SharedContext);

  return (
    <>
      <Blogcard attributes={attributes} />

      <div className="litobc-footer">
        <span className="litobc-has-cache-label">{hasCache && 'キャッシュから取得されました'}</span>
        <button className="litobc-link components-button is-tertiary">
          <a href={url} target="blank noopener noreferrer">
            リンク先を表示
          </a>
        </button>
      </div>
    </>
  );
}
