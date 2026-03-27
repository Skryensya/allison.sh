# Bot Detection v2.1 - Guía Completa

## Novedades en v2.1 (Performance)

### ⚡ Optimizaciones de Velocidad

1. **PoW más rápido** - Trailing zeros en vez de leading (más fácil encontrar)
2. **Difficulty reducida** - Base: 2 (antes 5), Max: 4 (antes 8)
3. **Challenge más corto** - 1s + 20 mouse (antes 3s + 50)
4. **ML features simplificadas** - Menos cálculos
5. **Automation lazy** - Solo verifica si ya hay flags
6. **Caching** - Automation y check results cacheados
7. **Adaptive PoW disabled** - Por defecto es false

### Tiempos Estimados

| Escenario | Antes | Ahora |
|-----------|-------|-------|
| PoW (base) | ~3-5s | ~0.5-1s |
| Challenge | ~5-8s | ~2-3s |
| Veredicto | ~100ms | ~10ms (cached) |

---

## Novedades en v2

### ✨ Nuevas Características

1. **ML Scoring** - Red neuronal simple combina reglas + aprendizaje
2. **WebGL Fingerprinting** - Detecta renderers software (llvmpipe, SwiftShader)
3. **Touch Events** - Soporte completo para dispositivos móviles
4. **Adaptive PoW** - Difficulty aumenta si detecta señales sospechosas
5. **Detección de Scripts Injectados** - $cdc_, __webdriver_evaluate, etc.
6. **Pause & Jitter Analysis** - Micro-movimientos humanos
7. **Silent Mode** - Sin UI visible
8. **Enhanced Fingerprint** - Audio, fonts, timezone, connection

---

## Cómo Funciona

```
1. Script carga → Badge v2 (o silent)
2. Early Automation Detection (antes de PoW)
3. Si detecta flags → Adaptive PoW (5-8)
4. Challenge interactivo mejorado
5. ML + Rules scoring → veredicto final
```

---

## Análisis (7 Capas + ML)

### 1. **Automation Flags (25%)** ← MEJORADO
```
- navigator.webdriver
- User Agent (headless, puppeteer, playwright)
- Scripts inyectados ($cdc_, __webdriver_evaluate)
- Cypress, Playwright, Selenide, Nightmare globals
- WebGL renderer (llvmpipe, SwiftShader)
- Proxy navigator
- Fake touch support
```
**Detecta:** Browsers automatizados y emuladores

### 2. **Patrones de Mouse (25%)** ← MEJORADO
```
- Trayectoria curvada (bots = recto)
- Velocidad variable vs constante
- Pausas naturales entre acciones
- Micro-jitter humano
- Teleporting (velocidad imposible)
```
**Detecta:** Puppeteer/Playwright (líneas rectas)

### 3. **Tiempo (15%)**
```
- Tiempo hasta primera acción
- Duración total de sesión
- Acciones por segundo
```

### 4. **Typing Analysis (15%)** ← MEJORADO
```
- Variación en gaps (CV)
- Backspaces (errores naturales)
- Paste events ← NUEVO
```

### 5. **Touch Events (10%)** ← NUEVO
```
- Touch positions
- Patrón variety (start/move/end)
- Richness score
```

### 6. **Sesión (5%)**
```
- Scroll behavior
- Selecciones de texto
- Right clicks
- Tab switches
- Clipboard events
```

### 7. **Ambiente (5%)**
```
- Canvas fingerprinting
- Plugins
- Language
- WebGL renderer
```

### 8. **ML Scoring** ← NUEVO
```
Combina features normalizados:
- timeToFirst (weight: -0.15)
- mouseCurvature (weight: +0.20)
- mouseVelocityCV (weight: +0.15)
- typingCV (weight: +0.12)
- actionsPerSec (weight: -0.10)
- hasPauses (weight: +0.08)
- hasJitter (weight: +0.05)
- hasTouch (weight: +0.10)
- hasPaste (weight: -0.15)
```

---

## API v2

```javascript
// Legacy (compatible)
LazyBot.createChallenge()          // Challenge estándar
LazyBot.isReady()                  // true si pasó
LazyBot.check()                   // { isBot, score, reasons }
LazyBot.reset()                   // Reset completo
LazyBot.getFingerprint()           // Hash único del device

// NUEVO v2
LazyBot.createChallenge({ silent: true })  // Sin UI
LazyBot.setSilentMode(true)                 // Activar/descativar UI
LazyBot.setAdaptiveDifficulty(false)       // Disable PoW adaptativo
LazyBot.getDifficulty()                    // Difficulty actual (5-8)
LazyBot.getAutomationFlags()              // { webdriver, injectedScripts, ... }
LazyBot.getMLFeatures()                   // { timeToFirst, curvature, ... }
LazyBot.getMLScore()                      // Score puro del ML (0-1)
LazyBot.version                           // 2
```

---

## Panel de Debug v2

```
┌─ LAZYBOT v2 ───────────────────┐
│ Status      ✓ HUMAN             │
├──────────────────────────────────┤
│ Mouse: 234  Clicks: 12          │
│ Keys: 89    Scrolls: 5         │
│ Touch: 0    Time: 45s           │
├──────────────────────────────────┤
│ PoW: 5 ✓ done                   │
├──────────────────────────────────┤
│ RESULT                           │
│ HUMAN (78%)                      │
│ ████████████████░░░░            │
│ ✓ Natural curves                 │
│ ✓ Natural pauses                 │
│ ✓ Typed 89 keys                  │
│ ✓ Natural typing variation       │
│ ML Score: 81.2%                  │
└──────────────────────────────────┘
```

---

## Adaptive Difficulty

```javascript
// Si detecta flags sospechosos, aumenta difficulty:
baseDifficulty = 5
+ (automationFlags.length * 0.5)
= max 8

// Flags que incrementan:
// - webdriver detected → +2
// - injected scripts → +1.5
// - headless UA → +1
// - etc.
```

---

## Fingerprint v2

```javascript
// Componentes del fingerprint:
{
  ua: navigator.userAgent,
  screen: "1920x1080x24",
  pixelRatio: 2,
  cores: 8,
  plugins: 5,
  touch: 0,
  lang: "es-ES",
  platform: "MacIntel",
  audio: 1234.56,           // AudioContext fingerprint
  fonts: "Arial,Georgia",   // FUBD detection
  webgl: "Intel Iris OpenGL",
  timezone: "America/Bogota",
  connection: "4g"
}
```

---

## Integración

```html
<script src="bot-detection.js"></script>
<script>
  // Modo estándar
  LazyBot.createChallenge();
  
  // Modo silent (no visible)
  LazyBot.createChallenge({ silent: true });
  
  // Verificar antes de submit
  document.querySelector('form').addEventListener('submit', (e) => {
    if (!LazyBot.isReady()) {
      e.preventDefault();
      alert('Completa el challenge');
      return;
    }
    
    const result = LazyBot.check();
    console.log('ML Score:', result.mlScore);
    console.log('Automation:', LazyBot.getAutomationFlags());
    console.log('ML Features:', LazyBot.getMLFeatures());
    
    if (result.isBot) {
      // CAPTCHA o bloqueo
    }
  });
</script>
```

---

## Pesos de Señales

| Señal | Peso | Baja si... |
|-------|------|------------|
| Automation flags | 25% | Cualquier flag |
| Mouse trajectory | 25% | >80% recto |
| ML score | 40% | <0.5 |
| Time patterns | 15% | <100ms reacción |
| Typing analysis | 15% | CV <0.15 |
| Touch events | 10% | No touch en mobile |
| Session patterns | 5% | >5 acciones/segundo |

---

## Score Final

```
100 = completamente humano
  0 = totalmente bot

< 50 = isBot: true
50-70 = sospechoso
> 70 = humano

Final = (RuleScore × 0.6) + (MLScore × 40) × 0.4
```

---

## Detección de Automatización

### Scripts Inyectados
```javascript
// Patrones detectados:
'$cdc_'
'__webdriver_evaluate'
'__selenium_evaluate'
'__webdriver_script_func'
'__webdriver_script_fn'
'_Selenium_IDE_Plugins'
```

### WebGL Renderers Sospechosos
```javascript
'llvmpipe'
'swiftshader'
'softpipe'
'software'
```

### Framework Detection
```javascript
window.Cypress
window.playwright
window.callPhantom
window._phantom
```
