type Props = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  showCaption?: boolean;
};

export default function PolaroidFigure({
  src,
  alt,
  className = '',
  showCaption = true,
}: Props) {
  return (
    <figure className={`polaroid-figure group ${className}`.trim()}>
      <div className="polaroid-figure__frame">
        <div className="polaroid-figure__media">
          <img className="polaroid-figure__img" src={src} alt={alt} loading="lazy" />
        </div>

        {showCaption ? (
          <figcaption className="polaroid-figure__caption" aria-hidden="true">{alt}</figcaption>
        ) : null}
      </div>
    </figure>
  );
}
