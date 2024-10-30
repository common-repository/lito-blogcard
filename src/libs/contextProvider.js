import { createContext, useState } from '@wordpress/element';

export const SharedContext = createContext();

export function SharedContextProvider({ children, defaultUrl }) {
  const [hasCache, setHasCache] = useState(false);
  const [searchQuery, setSearchQuery] = useState(defaultUrl);
  const [state, setState] = useState('hidden'); // 状態ごとに表示を変えるため

  return (
    <SharedContext.Provider
      value={{
        hasCache,
        setHasCache,

        searchQuery,
        setSearchQuery,
        state,
        setState,
      }}
    >
      {children}
    </SharedContext.Provider>
  );
}
