const Thumbnail = (props) => {
  const thumbnailUrl = () => {
    if (props.thumbnail) {
      return props.thumbnail;
    } else {
      const query = {
        w: 320,
        h: 180,
      };
      const queryString = new URLSearchParams(query).toString();

      return `https://s.wordpress.com/mshots/v1/${props.url}?${queryString}`;
    }
  };

  return (
    <img className="litobc-thumbnail" src={thumbnailUrl()} alt={props.title} aria-hidden="true" />
  );
};

export default Thumbnail;
