# allison.sh

Portfolio personal construido con Astro y Tailwind CSS v4.

El sitio está pensado como una pieza editorial más que como un portfolio tradicional: tipografía dominante, contenido breve, ritmo vertical cuidado y una interfaz sobria donde cada elemento tiene una razón de existir.

## Stack

- **Framework:** Astro 6
- **Styling:** Tailwind CSS v4
- **Contenido:** MDX
- **Fuentes:** Inter, Spline Sans Mono
- **Generación de OG images:** Satori + Resvg
- **Deploy:** sitio estático (`dist/`)

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

### Scripts disponibles

- `npm run dev` — servidor de desarrollo
- `npm run build` — genera OG images y build de producción
- `npm run preview` — previsualiza el build local
- `npm run start` — sirve `dist/` en el puerto 3000
- `npm run generate:og` — regenera imágenes Open Graph

## Estructura

```txt
src/
├── components/        # Componentes Astro
├── content/
│   └── proyectos/     # Proyectos en MDX
├── layouts/           # Layouts base y de proyectos
├── pages/             # Rutas
├── scripts/           # Scripts cliente
├── styles/            # Estilos globales
└── assets/            # Imágenes y recursos visuales
```

## Notas

- Los proyectos viven en `src/content/proyectos/*.mdx`
- El sitio genera imágenes OG durante el build
- Parte de la interacción visual se carga como módulos cliente generados en `scripts/build-client-modules.mjs`

## Filosofía

La idea no es mostrar mucho, sino mostrar con criterio.

- menos ruido
- más jerarquía
- mejor texto
- interacciones sutiles
- decisiones visuales deliberadas
