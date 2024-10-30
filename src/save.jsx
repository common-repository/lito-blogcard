import { useBlockProps } from '@wordpress/block-editor';
import Blogcard from './components/Blogcard';

export default function save({ attributes }) {
  const blockProps = useBlockProps.save();

  return (
    <div {...blockProps}>
      <Blogcard attributes={attributes} />
    </div>
  );
}
