# Flexoki skill

Guía práctica para usar **Flexoki** (https://stephango.com/flexoki) dentro de este proyecto.

## Qué es

Flexoki es una paleta pensada para **lectura y escritura en pantalla**. Su intención no es verse “tech” ni saturada, sino sentirse como **tinta sobre papel**: cálida, sobria, legible y con buen contraste en light/dark mode.

Principios clave:
- alto contraste sin verse agresivo
- tonos cálidos y terrosos
- base neutra para texto e interfaz
- acentos reservados para significado, enlaces, estados o código
- consistencia perceptual entre light y dark mode

---

## Cómo está organizada

Flexoki tiene 2 grupos principales:

### 1. Base colors
Sirven para fondos, bordes y texto.

Escala base:
- `paper` `#FFFCF0`
- `50` `#F2F0E5`
- `100` `#E6E4D9`
- `150` `#DAD8CE`
- `200` `#CECDC3`
- `300` `#B7B5AC`
- `400` `#9F9D96`
- `500` `#878580`
- `600` `#6F6E69`
- `700` `#575653`
- `800` `#403E3C`
- `850` `#343331`
- `900` `#282726`
- `950` `#1C1B1A`
- `black` `#100F0F`

### 2. Accent colors
Sirven para enlaces, estados, resaltados y syntax highlighting.

Familias:
- red
- orange
- yellow
- green
- cyan
- blue
- purple
- magenta

Valores más usados:
- en tema claro: normalmente `600`
- en tema oscuro: normalmente `400`

Ejemplo:
- `blue-600` `#205EA6`
- `blue-400` `#4385BE`

---

## Mapeo semántico oficial

Flexoki propone nombrar los colores por **función**, no solo por tono.

### Base semántica
- `bg`: fondo principal
- `bg-2`: fondo secundario
- `ui`: bordes normales
- `ui-2`: bordes/estados hover
- `ui-3`: bordes/estados activos
- `tx-3`: texto tenue
- `tx-2`: texto secundario o apagado
- `tx`: texto principal

### Acentos semánticos
- `re`: errores
- `or`: warnings / funciones
- `ye`: constantes
- `gr`: éxito / keywords
- `cy`: links / estados activos / strings
- `bl`: variables / atributos
- `pu`: números
- `ma`: features del lenguaje

---

## Relación light/dark

Flexoki no usa exactamente los mismos hex para light y dark en cada rol semántico. Cambia el rol según el contexto.

### Tema claro
- `bg` → `paper`
- `bg-2` → `base-50`
- `ui` → `base-100`
- `ui-2` → `base-150`
- `ui-3` → `base-200`
- `tx-3` → `base-700`
- `tx-2` → `base-600`
- `tx` → `black`

Acentos recomendados:
- usar `*-600`

### Tema oscuro
- `bg` → `black`
- `bg-2` → `base-950`
- `ui` → `base-900`
- `ui-2` → `base-850`
- `ui-3` → `base-800`
- `tx-3` → `base-700`
- `tx-2` → `base-500`
- `tx` → `base-200`

Acentos recomendados:
- usar `*-400`

---

## Regla importante de uso

### Los neutros sí pueden derivarse con opacidad
Steph Ango indica que los valores base pueden derivarse mezclando `black` y `paper` con opacidad.

Ejemplo conceptual:
- un tono equivalente a `base-600` puede obtenerse con negro al 60% sobre `paper`

### Los acentos NO deben derivarse con opacidad
No conviene hacer:
- `blue` con opacidad 60%
- `red` con alpha para simular otros pasos

Motivo:
- eso desatura el color
- rompe el efecto “pigmento” que Flexoki busca

Para acentos, usar siempre los valores explícitos de la escala extendida (`50` a `950`).

---

## Cuándo usar cada color en UI

### Fondos
- página principal: `bg`
- superficies secundarias: `bg-2`
- no abusar de cajas; Flexoki funciona mejor con superficies limpias

### Bordes
- borde sutil: `ui`
- hover o mayor definición: `ui-2`
- foco, activo o separación fuerte: `ui-3`

### Texto
- cuerpo principal: `tx`
- metadatos, fechas, labels discretos: `tx-2`
- notas, captions, detalles muy secundarios: `tx-3`

### Links y acentos
- links: `cy`
- estados activos: `cy`
- errores: `re`
- éxito: `gr`
- destacar números, tags o detalles conceptuales: `pu`, `ma`, `or`, según significado

---

## Cómo usarlo bien en este proyecto

Dado que **allison.sh** es tipográfico, minimalista y sobrio, Flexoki encaja mejor si se usa con moderación.

### Recomendaciones específicas
- mantener la mayor parte de la interfaz en neutros
- usar un solo acento dominante para links y foco, probablemente `cyan` o `blue`
- usar `tx-2` y `tx-3` para jerarquía editorial, no para esconder contenido importante
- evitar bloques muy coloreados o cards ruidosas
- reservar `red`, `orange`, `green`, etc. para estados reales, no decoración
- en dark mode, preservar la calidez; no llevar la UI a grises fríos

### Para la estética del sitio
Flexoki funciona especialmente bien si:
- hay mucho espacio en blanco
- la tipografía tiene protagonismo
- los bordes son discretos
- los hovers son sutiles
- el color aparece como señal, no como relleno

---

## Implementación recomendada con variables CSS

```css
:root {
  --flexoki-paper: #FFFCF0;
  --flexoki-black: #100F0F;

  --flexoki-50: #F2F0E5;
  --flexoki-100: #E6E4D9;
  --flexoki-150: #DAD8CE;
  --flexoki-200: #CECDC3;
  --flexoki-600: #6F6E69;
  --flexoki-700: #575653;

  --flexoki-blue-600: #205EA6;
  --flexoki-cyan-600: #24837B;
  --flexoki-red-600: #AF3029;

  --bg: var(--flexoki-paper);
  --bg-2: var(--flexoki-50);
  --ui: var(--flexoki-100);
  --ui-2: var(--flexoki-150);
  --ui-3: var(--flexoki-200);
  --tx: var(--flexoki-black);
  --tx-2: var(--flexoki-600);
  --tx-3: var(--flexoki-700);
  --link: var(--flexoki-cyan-600);
}

.dark {
  --bg: var(--flexoki-black);
  --bg-2: #1C1B1A;
  --ui: #282726;
  --ui-2: #343331;
  --ui-3: #403E3C;
  --tx: #CECDC3;
  --tx-2: #878580;
  --tx-3: #575653;
  --link: #3AA99F;
}
```

---

## Implementación mental en Tailwind

Aunque no uses un paquete oficial, la idea correcta es mapear Flexoki a tokens semánticos:

- `background` → `bg`
- `foreground` → `tx`
- `muted` → `tx-2`
- `border` → `ui`
- `accent` o `primary` → `cy` o `bl`

No pensar en:
- “quiero un gris 200”

Sí pensar en:
- “esto es texto secundario”
- “esto es borde”
- “esto es superficie secundaria”

Eso mantiene coherencia al alternar light/dark.

---

## Syntax highlighting según Flexoki

Mapeo sugerido por el autor:
- comentarios → `tx-3`
- puntuación / operadores → `tx-2`
- imports o inválidos → `re`
- funciones → `or`
- constantes → `ye`
- keywords → `gr`
- strings → `cy`
- variables / atributos → `bl`
- números → `pu`
- features del lenguaje → `ma`

Para código:
- light mode → usar acentos `600`
- dark mode → usar acentos `400`

---

## Errores comunes al usar Flexoki

- usar demasiados acentos al mismo tiempo
- tratar Flexoki como una paleta pastel decorativa
- inventar tonos intermedios de acentos con alpha
- subir demasiado el contraste de bordes y divisores
- hacer cards o badges demasiado “UI-first” en una interfaz editorial
- usar colores brillantes para llamar atención donde la tipografía ya resuelve la jerarquía

---

## Regla corta de bolsillo

Si algo se lee como **prosa**, usar neutros.
Si algo comunica **estado o interacción**, usar acento.
Si dudas, usar menos color.

---

## Cómo se usa realmente en el markup de stephango.com/flexoki

Inspeccionando el HTML y CSS de la misma página, la implementación real sigue un patrón muy claro:

### 1. Primero define la paleta completa como variables base
En `:root` declara todos los hex:
- `--flexoki-paper`
- `--flexoki-black`
- `--flexoki-50` a `--flexoki-950`
- `--flexoki-red-50` a `--flexoki-red-950`
- igual para orange, yellow, green, cyan, blue, purple y magenta

O sea: **primero existe la escala cruda**.

### 2. Luego crea tokens semánticos para light y dark
No usa los hex directamente en toda la UI. Hace un segundo mapeo:

```css
:root,
.theme-light {
  --color-bg-primary: var(--flexoki-paper);
  --color-bg-secondary: var(--flexoki-50);
  --color-tx-normal: var(--flexoki-black);
  --color-tx-muted: var(--flexoki-600);
  --color-tx-faint: var(--flexoki-300);
  --color-ui-normal: var(--flexoki-100);
  --color-ui-hover: var(--flexoki-150);
  --color-ui-active: var(--flexoki-200);
  --color-action: var(--flexoki-cyan-600);

  --color-re: var(--flexoki-red-600);
  --color-or: var(--flexoki-orange-600);
  --color-ye: var(--flexoki-yellow-600);
  --color-gr: var(--flexoki-green-600);
  --color-cy: var(--flexoki-cyan-600);
  --color-bl: var(--flexoki-blue-600);
  --color-pu: var(--flexoki-purple-600);
  --color-ma: var(--flexoki-magenta-600);
}

.theme-dark {
  --color-bg-primary: var(--flexoki-black);
  --color-bg-secondary: var(--flexoki-950);
  --color-tx-normal: var(--flexoki-200);
  --color-tx-muted: var(--flexoki-500);
  --color-tx-faint: var(--flexoki-700);
  --color-ui-normal: var(--flexoki-900);
  --color-ui-hover: var(--flexoki-850);
  --color-ui-active: var(--flexoki-800);
  --color-action: var(--flexoki-cyan-400);

  --color-re: var(--flexoki-red-400);
  --color-or: var(--flexoki-orange-400);
  --color-ye: var(--flexoki-yellow-400);
  --color-gr: var(--flexoki-green-400);
  --color-cy: var(--flexoki-cyan-400);
  --color-bl: var(--flexoki-blue-400);
  --color-pu: var(--flexoki-purple-400);
  --color-ma: var(--flexoki-magenta-400);
}
```

Esto confirma que Flexoki se usa mejor en **dos capas**:
- capa 1: paleta
- capa 2: tokens semánticos

### 3. El markup usa clases utilitarias mínimas
La página no “pinta” cada elemento con hex inline. Usa clases pequeñas que ya apuntan a tokens:

```css
.bg { background-color: var(--color-bg-primary); }
.bg-2 { background-color: var(--color-bg-secondary); }
.bg-tx { background-color: var(--color-tx-normal); }
.bg-tx-2 { background-color: var(--color-tx-muted); }
.bg-tx-3 { background-color: var(--color-tx-faint); }
.bg-ui { background-color: var(--color-ui-normal); }
.bg-ui-2 { background-color: var(--color-ui-hover); }
.bg-ui-3 { background-color: var(--color-ui-active); }
.bg-cy { background-color: var(--color-cy); }
.bg-cy-2 { background-color: var(--color-cy-hover); }
```

Y luego el HTML queda así:

```html
<div class="swatch swatch-wide bg"></div>
<div class="swatch swatch-wide bg-2"></div>
<div class="swatch swatch-wide bg-ui"></div>
<div class="swatch swatch-wide bg-tx"></div>
<div class="swatch swatch-wide bg-cy"></div>
<div class="swatch swatch-wide bg-cy-2"></div>
```

O sea: **el nombre de la clase representa el rol, no el color decorativo**.

### 4. Los acentos tienen estado principal y hover
En CSS define pares como:
- `--color-cy` y `--color-cy-hover`
- `--color-re` y `--color-re-hover`
- etc.

Y los expone con clases:
- `.bg-cy`
- `.bg-cy-2`
- `.bg-re`
- `.bg-re-2`

Eso es útil porque no solo existe “el color”, también existe su comportamiento interactivo.

### 5. El dark mode no recompone el HTML, solo cambia variables
El body agrega la clase `theme-dark`:

```html
<body>
  <script>
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.querySelector('body').classList.add('theme-dark')
    }
  </script>
</body>
```

No cambia el markup de componentes. Solo cambia el set de variables activas. Eso hace que:
- el mismo HTML funcione en ambos temas
- la jerarquía visual se conserve
- los acentos cambien de `600` a `400` automáticamente

### 6. Links, selección y foco también usan tokens
No se limita a fondos y texto. También aplica Flexoki a:
- `::selection`
- `mark`
- links hover
- fondos de foco
- bordes
- inputs
- syntax highlighting
- popovers y toggles

Ejemplos reales del CSS:

```css
::selection { background: var(--color-selection); }
mark { background-color: var(--color-highlight); }
a:hover { color: var(--color-action); }
a:focus { background-color: var(--color-bg-hover); }
.ba { border: 1px solid var(--color-ui-normal); }
```

Esto importa porque demuestra que Flexoki no es solo una paleta de branding: es un **sistema completo de interfaz**.

### 7. Syntax highlighting usa la misma semántica
La página también mapea tokens de código a variables Flexoki:

```css
.highlight .c  { color: var(--color-tx-faint); }
.highlight .k  { color: var(--color-gr); }
.highlight .m  { color: var(--color-pu); }
.highlight .s2 { color: var(--color-cy); }
.highlight .na { color: var(--color-or); }
.highlight .err { color: var(--color-re); }
```

Eso confirma que la semántica de Flexoki está pensada para cruzar:
- prosa
- UI
- código

### 8. La lección práctica del markup
La implementación real de Steph Ango sugiere este orden correcto:

1. declarar la escala completa
2. mapearla a tokens semánticos por tema
3. exponer utilidades pequeñas o aliases (`bg`, `bg-2`, `bg-ui`, `bg-cy`)
4. usar esas utilidades en el markup
5. cambiar solo variables al pasar a dark mode

### Patrón que conviene replicar en este proyecto
Para `allison.sh`, lo correcto no sería usar clases del tipo:
- `text-[#205EA6]`
- `border-[#E6E4D9]`
- `bg-[#FFFCF0]`

Lo correcto sería algo más cercano a:
- `text-[var(--tx)]`
- `text-[var(--tx-2)]`
- `border-[var(--ui)]`
- `bg-[var(--bg)]`
- `text-[var(--link)]`

O mejor aún: crear aliases semánticos del proyecto (`--bg`, `--bg-2`, `--tx`, `--tx-2`, `--ui`, `--link`) montados encima de Flexoki.

### Conclusión de la investigación del markup
Steph Ango **no usa Flexoki como una lista de colores sueltos**.
Lo usa como:
- paleta base completa
- sistema de tokens semánticos
- utilidades de markup muy pequeñas
- intercambio de tema por variables, no por reescritura de componentes

Ese es el detalle más importante para implementarlo bien.

---

## Resumen operativo

1. Usa la escala base para fondos, bordes y texto.
2. Usa acentos solo para semántica o énfasis real.
3. En light, favorece `600`; en dark, `400`.
4. No derives acentos con opacidad.
5. Nombra tokens por función (`bg`, `ui`, `tx`) y no por hex.
6. Para este sitio, Flexoki funciona mejor como sistema editorial sobrio, no como branding llamativo.

---

## Fuente

Basado en la documentación pública de Steph Ango:
- https://stephango.com/flexoki
