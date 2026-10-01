# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Allison.sh** - Minimalist personal portfolio website built with Astro and Tailwind CSS v4. The site emphasizes typography, text-focused content, and a brutalist aesthetic. It should feel more like an essay than a traditional portfolio.

## Design Philosophy

- **Minimalist & text-focused**: The site prioritizes content and typography over decoration
- **Intentional**: Every element should feel deliberate, not template-like
- **Personal voice**: Writing should reflect how Allison thinks, not just what she does
- **Sobrio**: No marketing language, buzzwords, or corporate tone

## Lista de mejoras (ordenadas por impacto)

### 1. Hero (CRÍTICO)
- Reemplazar frases genéricas ("Me gusta construir...", "I love...")
- Definir en 1–2 líneas:
  - Qué tipo de problemas te interesan
  - Cómo piensas el desarrollo (no qué herramientas usas)
- Test: si otra persona podría copiar tu frase → está mal

### 2. Proyectos como piezas, no lista
Cada proyecto debe tener:
- Una línea con interpretación, no descripción
- 1–2 señales de pensamiento (decisiones, trade-offs)
- Por qué existe
- Qué lo hace interesante

Evitar: "Desarrollé...", "Este proyecto es..."
Incluir: intención, decisiones, por qué es interesante

### 3. Jerarquía tipográfica
Diferenciar claramente:
- H1 (muy dominante)
- Títulos de proyectos
- Body

Ajustar: tamaño (más contraste), spacing vertical (más ritmo)
Objetivo: que se pueda escanear sin leer todo

### 4. Ritmo vertical
- Aumentar separación entre bloques
- Evitar "bloques pegados"
- Introducir pausas visuales
- Limpiar cualquier resto de "portfolio template"

### 5. Eliminar contenido redundante
Quitar:
- Secciones tipo skills
- Frases de CV
- Labels innecesarios

Todo debe sentirse intencional, no estándar

### 6. Señales de pensamiento (sin escribir aún)
En proyectos:
- Decisiones difíciles
- Cosas que no funcionaron
- Cosas que harías distinto

### 7. Lenguaje
Cambiar:
- Descriptivo → interpretativo
- Neutro → con criterio

Evitar: buzzwords, lenguaje corporativo
Buscar: precisión + personalidad

### 8. Navegación
Mantener:
- Home
- Proyectos (implícitos en home)
- About (opcional)

Evitar: secciones vacías, múltiples niveles innecesarios

### 9. Microdetalles de calidad
- Hover states sutiles
- Selección de texto personalizada
- Links bien definidos (no ambiguos)

## Tech Stack

- **Framework**: Astro 6.x (Static Site Generation)
- **Styling**: Tailwind CSS v4
- **TypeScript**: Enabled
- **Deployment**: Docker with npx serve (Dockploy)

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Astro components (Avatar, SpeechBubble, etc.)
├── content/
│   ├── proyectos/     # Project markdown files (Spanish)
│   └── projects/      # Same slugs, English
├── data/               # Static data (avatar sprite config)
├── i18n/               # Locales, URL helpers, UI strings (messages.ts), avatar phrases
├── layouts/            # Page layouts (Base, Project)
├── pages/              # Spanish routes at the root, English under /en (thin wrappers)
├── templates/          # Shared page bodies (HomePage, ProjectPage, NotFoundPage) taking a `locale`
├── scripts/            # Client-side scripts (avatar-client)
└── styles/             # Global styles
```

## Internationalization (es / en)

- Spanish is the default locale at the root (`/`, `/proyectos/<slug>`); English lives under `/en` (`/en/`, `/en/projects/<slug>`).
- Route components in `src/pages` only pick a locale and render a template from `src/templates`.
- UI copy lives in `src/i18n/messages.ts` (both locales must keep the same shape). Components get the locale from the URL (`getLocaleFromUrl`) and read `messages[locale]`.
- Project content: each project exists in both `src/content/proyectos/<slug>.mdx` and `src/content/projects/<slug>.mdx` (same slug, same `order`, translated prose). Internal links in English MDX use `/en/projects/<slug>`.
- Client scripts read copy from the page (`<html lang>` or `data-*` attributes) instead of bundling dictionaries; avatar phrases are in `src/i18n/phrases.ts`.
- Social images are generated per locale (`public/og/en/…`, `public/twitter/en/…`) by `npm run generate:og`.
- Language choice is stored in `localStorage` (`allison.sh:lang`). The first visit to a Spanish page from a non-Spanish browser redirects to its English twin; the footer switcher always overrides it. Anchor ids (`#proyectos`, `#sobre-mi`, `#contacto`) are shared by both locales because CSS targets them.
