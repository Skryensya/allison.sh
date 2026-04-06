type Props = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  showCaption?: boolean;
};

export default function HalftonePolaroid({
  src,
  alt,
  className = '',
  showCaption = true,
}: Props) {
  return (
    <figure className={`halftone-polaroid group ${className}`.trim()}>
      <div className="halftone-polaroid__frame">
        <div className="halftone-polaroid__media">
          <img className="halftone-polaroid__img" src={src} alt={alt} loading="lazy" />
        </div>

        {showCaption ? (
          <figcaption className="halftone-polaroid__caption" aria-hidden="true">{alt}</figcaption>
        ) : null}
      </div>
    </figure>
  );
}
