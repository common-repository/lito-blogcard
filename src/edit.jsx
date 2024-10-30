import { SharedContextProvider } from './libs/contextProvider';
import { useBlockProps } from '@wordpress/block-editor';
import SiteSearch from './components/SiteSearch';
import Controls from './components/Controls';
import Display from './components/Display';

export default function Edit({ attributes, setAttributes }) {
  return (
    <SharedContextProvider defaultUrl={attributes.url}>
      <div {...useBlockProps()}>
        <SiteSearch attributes={attributes} setAttributes={setAttributes} />
        <Display attributes={attributes} />
      </div>

      <Controls attributes={attributes} setAttributes={setAttributes} />
    </SharedContextProvider>
  );
}
