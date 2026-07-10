# Folder system

Resumen corto del sistema de carpetas del sitio.

## Objetivo

Mostrar proyectos como folders apilados, con una forma SVG adaptable al contenido, previews opcionales y una interacción simple en desktop/mobile.

## Piezas

### `src/components/FolderSurface.astro`
Primitiva visual base del folder.

Responsabilidades:
- renderizar el SVG base
- renderizar título y descripción
- soportar variantes por props
- exponer la estructura `data-*` que usa el script de shapes

Props relevantes:
- `title`
- `description`
- `titleTag`
- `year`
- `gradient`
- `active`
- `minHeight`
- `svgHeight`
- `rootClassName`
- `titleClassName`
- `descriptionClassName`

### `src/components/ProjectFolderCard.astro`
Un folder clickeable de proyecto.

Responsabilidades:
- envolver `FolderSurface`
- renderizar previews opcionales
- exponer el root `data-project-folder-card`

### `src/components/ProjectFolderStack.astro`
Contenedor del stack.

Responsabilidades:
- overlap visual entre cards
- lift/hover/focus states
- estilos de previews
- importar el script de interacción del stack

## Scripts

### `src/scripts/folder-shapes-client.ts`
Calcula la forma del folder.

Responsabilidades:
- medir label + description
- ajustar altura del SVG
- construir el `path` del folder
- actualizar `viewBox`
- escribir:
  - `--folder-content-bottom`
  - `--folder-clip-path`

No debería encargarse de:
- hover
- previews
- lógica de scroll del stack

### `src/scripts/project-folder-stack-client.ts`
Controla la interacción del stack.

Responsabilidades:
- reveal inicial del stack
- lazy-load de previews
- abrir/cerrar previews
- marcar item activo en mobile según scroll

No debería encargarse de:
- geometría del SVG
- contenido interno del folder

## Contrato `data-*`

Estos atributos son el contrato actual entre componentes y scripts.

### Usados por `folder-shapes-client.ts`
- `data-folder`
- `data-folder-label`
- `data-folder-description`
- `data-folder-svg`
- `data-folder-fill-path`

### Usados por `project-folder-stack-client.ts`
- `data-project-folder-stack`
- `data-project-folder-card`
- `data-folder-preview-img`

### Usados por CSS del stack
- `data-preview-count`
- `data-preview-open`
- `data-active`
- `data-preview-index`

## Flujo mental recomendado

1. `FolderSurface` define cómo se ve un folder
2. `folder-shapes-client.ts` adapta esa forma al contenido real
3. `ProjectFolderCard` convierte ese folder en una pieza de proyecto
4. `ProjectFolderStack` apila varias piezas y les da comportamiento
5. `project-folder-stack-client.ts` activa previews y estado mobile

## Si hay que modificar algo

### Cambiar look base del folder
Tocar primero:
- `src/components/FolderSurface.astro`

### Cambiar comportamiento del stack
Tocar primero:
- `src/components/ProjectFolderStack.astro`
- `src/scripts/project-folder-stack-client.ts`

### Cambiar geometría del folder
Tocar primero:
- `src/scripts/folder-shapes-client.ts`

## Regla práctica

Si un cambio requiere tocar al mismo tiempo:
- shape del SVG
- hover del stack
- lógica mobile

probablemente el cambio está mezclando responsabilidades y conviene separarlo antes.
