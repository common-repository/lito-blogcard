import he from 'he';
import Thumbnail from './Thumbnail';
import { getDomainFromUrl } from '../util';

export default function Blogcard({ attributes }) {
  const {
    url,
    target,
    nofollow,
    noopener,
    noreferrer,
    sponsored,
    ugc,
    showThumbnail,
    title,
    description,
    thumbnailUrl,
    faviconUrl,
  } = attributes;

  const rels = [];
  if (noopener) rels.push('noopener');
  if (nofollow) rels.push('nofollow');
  if (noreferrer) rels.push('noreferrer');
  if (sponsored) rels.push('sponsored');
  if (ugc) rels.push('ugc');

  const displayTitle = title;
  const displayDescription = description;
  const domain = getDomainFromUrl(url);

  return (
    <article className="litobc" cite={url}>
      <a
        className="litobc-item"
        href={url}
        target={target !== '' ? target : null}
        rel={rels.join(' ')}
      >
        {!showThumbnail && (
          <figure className="litobc-figure">
            {thumbnailUrl ? (
              <img className="litobc-thumbnail" src={thumbnailUrl} alt="" aria-hidden="true" />
            ) : (
              <Thumbnail url={url} thumbnailUrl={thumbnailUrl} />
            )}
          </figure>
        )}
        <div className="litobc-content">
          {displayTitle && <div className="litobc-title">{he.decode(displayTitle)}</div>}
          {displayDescription && (
            <div className="litobc-description">{he.decode(displayDescription)}</div>
          )}
          <div className="litobc-cite">
            {faviconUrl && (
              <img className="litobc-favicon" src={faviconUrl} alt="" aria-hidden="true" />
            )}
            <div className="litobc-domain">{domain}</div>
          </div>
        </div>
      </a>
    </article>
  );
}
