import type { Locale } from './index';

/** UI copy for both locales. Keep the two objects structurally identical (checked by `satisfies`). */
const es = {
  site: {
    role: 'Desarrollador web full stack',
    description:
      'Diseño y desarrollo interfaces web claras, accesibles y rápidas. Me interesan los sistemas y las decisiones que hacen útil una experiencia.',
  },
  a11y: {
    skipToContent: 'Saltar al contenido principal',
    mainNavigation: 'Navegación principal',
  },
  nav: { work: 'work', about: 'about', contact: 'contact' },
  home: {
    title: 'Allison Peña — Interfaces web claras, rápidas y accesibles',
    imageAlt: 'Allison.sh — Interfaces con intención',
    twitterImageAlt: 'Allison.sh — Vista previa para X',
    heroTitle: 'Construyo interfaces que se sienten bien.',
    heroLead:
      'Me gusta construir cosas para la web, prototipar e iterar hasta que las ideas queden bien resueltas, poniendo atención en los detalles y buscando soluciones simples a problemas complejos.',
    projectsHeading: 'Proyectos',
    aboutHeading: 'Sobre mí',
    aboutLead:
      'Me gusta entender cómo funcionan las cosas y llevarlas un poco más allá. Disfruto construir, iterar, simplificar. Tengo una fascinación genuina por el diseño y me gusta trabajar cerca de él.',
    aboutBody:
      'Fuera del trabajo paso tiempo aprendiendo noruego, jugando ajedrez y explorando música. También construyo proyectos personales de forma constante, más por curiosidad que por necesidad.',
    aboutLinkText: 'Este sitio',
    aboutAfterLink: 'es una extensión de eso.',
    previewAlt: (title: string) => `Preview de ${title}`,
  },
  footer: {
    contact: 'Contacto',
    siteVersion: 'Versión del sitio',
    changeTheme: 'Cambiar tema',
    themeDark: 'Tema oscuro activo',
    themeLight: 'Tema claro activo',
    switchLanguage: 'Cambiar a inglés',
    languageName: 'Idioma',
  },
  project: {
    back: 'volver',
    backToHome: 'Volver al inicio',
    personal: 'Proyecto personal',
    next: 'siguiente',
    previewAlt: (title: string) => `Preview de ${title}`,
    ogImageAlt: (title: string) => `Vista previa del proyecto ${title}`,
    twitterImageAlt: (title: string) => `Vista previa en X del proyecto ${title}`,
    enlargeImage: 'Ampliar imagen',
    enlargeImageNamed: (name: string) => `Ampliar imagen: ${name}`,
    imageFallbackName: 'imagen',
  },
  lightbox: {
    label: 'Visor de imágenes',
    close: 'Cerrar',
    previous: 'Imagen anterior',
    next: 'Imagen siguiente',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    resetZoom: 'Restablecer zoom',
    error: 'No se pudo cargar.',
    counter: 'Imagen {index} de {count}',
  },
  notFound: {
    title: '404 — Página no encontrada',
    description: 'La página que buscas no existe en Allison.sh.',
    heading: 'Nada aquí.',
    body: 'La página que buscas no existe, o quizás nunca existió. El link puede estar roto o mal escrito.',
    back: 'Volver al inicio',
  },
};

const en: typeof es = {
  site: {
    role: 'Full stack web developer',
    description:
      "I design and build clear, accessible and fast web interfaces. I'm interested in systems and in the decisions that make an experience useful.",
  },
  a11y: {
    skipToContent: 'Skip to main content',
    mainNavigation: 'Main navigation',
  },
  nav: { work: 'work', about: 'about', contact: 'contact' },
  home: {
    title: 'Allison Peña — Clear, fast and accessible web interfaces',
    imageAlt: 'Allison.sh — Interfaces with intent',
    twitterImageAlt: 'Allison.sh — Preview for X',
    heroTitle: 'I build interfaces that feel good.',
    heroLead:
      'I like building things for the web, prototyping and iterating until ideas are well resolved, paying attention to the details and looking for simple solutions to complex problems.',
    projectsHeading: 'Projects',
    aboutHeading: 'About me',
    aboutLead:
      'I like understanding how things work and taking them a little further. I enjoy building, iterating, simplifying. I have a genuine fascination with design and I like working close to it.',
    aboutBody:
      'Outside of work I spend my time learning Norwegian, playing chess and exploring music. I also build personal projects constantly, more out of curiosity than necessity.',
    aboutLinkText: 'This site',
    aboutAfterLink: 'is an extension of that.',
    previewAlt: (title: string) => `Preview of ${title}`,
  },
  footer: {
    contact: 'Contact',
    siteVersion: 'Site version',
    changeTheme: 'Change theme',
    themeDark: 'Dark theme active',
    themeLight: 'Light theme active',
    switchLanguage: 'Switch to Spanish',
    languageName: 'Language',
  },
  project: {
    back: 'back',
    backToHome: 'Back to home',
    personal: 'Personal project',
    next: 'next',
    previewAlt: (title: string) => `Preview of ${title}`,
    ogImageAlt: (title: string) => `Preview of the ${title} project`,
    twitterImageAlt: (title: string) => `X preview of the ${title} project`,
    enlargeImage: 'Enlarge image',
    enlargeImageNamed: (name: string) => `Enlarge image: ${name}`,
    imageFallbackName: 'image',
  },
  lightbox: {
    label: 'Image viewer',
    close: 'Close',
    previous: 'Previous image',
    next: 'Next image',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom',
    error: "Couldn't load.",
    counter: 'Image {index} of {count}',
  },
  notFound: {
    title: '404 — Page not found',
    description: "The page you're looking for doesn't exist on Allison.sh.",
    heading: 'Nothing here.',
    body: "The page you're looking for doesn't exist, or maybe it never did. The link may be broken or mistyped.",
    back: 'Back to home',
  },
};

export const messages: Record<Locale, typeof es> = { es, en };

export function useTranslations(locale: Locale) {
  return messages[locale];
}
