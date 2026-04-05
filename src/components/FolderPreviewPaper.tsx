import { useEffect, useState } from 'react';
import { HalftoneDots } from '@paper-design/shaders-react';

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export default function FolderPreviewPaper({ src, alt, className = '' }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [useSimpleImage, setUseSimpleImage] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)');
    const update = () => setUseSimpleImage(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = src;
    img.decoding = 'async';

    const markLoaded = () => {
      if (active) setIsLoaded(true);
    };

    if (img.complete) markLoaded();
    else {
      img.onload = markLoaded;
      img.onerror = markLoaded;
    }

    return () => {
      active = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div className={`folder-preview-paper ${isLoaded ? 'is-ready' : 'is-loading'} ${className}`.trim()} aria-hidden="true">
      {isLoaded ? (
        useSimpleImage ? (
          <img className="folder-preview-paper__img folder-preview-paper__img--visible" src={src} alt={alt} loading="lazy" decoding="async" />
        ) : (
          <>
            <img className="folder-preview-paper__img" src={src} alt={alt} loading="lazy" decoding="async" />

            <div className="folder-preview-paper__shader" aria-hidden="true">
              <HalftoneDots
                width={1280}
                height={720}
                image={src}
                colorBack="#f2f1e8"
                colorFront="#2b2b2b"
                originalColors={false}
                type="gooey"
                grid="hex"
                inverted={false}
                size={0.5}
                radius={1.25}
                contrast={0.4}
                grainMixer={0.2}
                grainOverlay={0.2}
                grainSize={0.5}
                fit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </>
        )
      ) : (
        <div className="folder-preview-paper__placeholder" aria-hidden="true" />
      )}
    </div>
  );
}
