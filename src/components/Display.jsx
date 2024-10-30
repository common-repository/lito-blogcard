import { useContext } from '@wordpress/element';
import { SharedContext } from '../libs/contextProvider';
import ReactLoading from 'react-loading';
import Result from './Result';

export default function Display({ attributes }) {
  const { state } = useContext(SharedContext);

  const InfoText = (props) => {
    return <div className="litobc-message">{props.children}</div>;
  };

  switch (state) {
    case 'url-empty':
      return <InfoText>URLまたはキーワードを入力してください</InfoText>;

    case 'url-invalid':
      return;

    case 'search':
      return (
        <ReactLoading
          class="litobc-loading"
          type="spin"
          color="rgb(253 210 59)"
          width="20px"
          height="20px"
        />
      );

    case 'data-success':
      return <Result attributes={attributes} />;

    case 'fetch-error':
      return (
        <>
          <InfoText>データを取得できませんでした</InfoText>
        </>
      );

    default:
      return '';
  }
}
