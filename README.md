# FF GAMES — Motor de gamificación de entrenamiento

Motor propio (sin costo, sin dependencias externas) para crear repasos y
entrenamientos gamificados del equipo de Field Force, inspirado en las
dinámicas que ya trabajaste en Genially (REALMEOW y Breakout Videojuego).

Combina dos mecánicas en un mismo motor:

- **Narrativa** (`type: "narrative"`): pregunta con opciones, cada una con su
  propio feedback en forma de diálogo — igual que las objeciones de cliente
  en REALMEOW.
- **Misión / fragmentos** (`type: "mission"`): al acertar, el nivel entrega un
  fragmento (letra o número) que se acumula para armar un código final —
  igual que el mecanismo de contraseña de Breakout Videojuego.

Puedes mezclar ambos tipos de nivel dentro de un mismo juego (ver
`content/demo-hibrido.json`).

## Estructura del proyecto

```
index.html              Menú principal, lista de juegos disponibles
play.html               Jugar en modo individual (asíncrono)
live/host.html          Anfitrión de una partida en vivo (genera código, ranking)
live/join.html          Jugador se une a una partida en vivo con un código
engine/game-engine.js   Motor: lee el JSON de contenido y renderiza el juego
engine/results-client.js Envío/lectura de resultados contra Google Sheets
engine/styles.css       Estilos (tema oscuro tipo consola, acento Huawei)
content/*.json          Contenido de cada juego (tú los editas o me pasas el insumo)
backend/Code.gs         Backend en Google Apps Script (guarda resultados en Sheets)
```

## 1. Configurar el backend (Google Sheets)

1. Crea un Google Sheet nuevo.
2. Extensiones → Apps Script. Borra el contenido por defecto y pega
   `backend/Code.gs`.
3. Implementar → Nueva implementación → tipo **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (o con cuenta de Google, si
     quieres exigir login de dominio Huawei/agencia).
4. Copia la URL que te entrega ("Web app URL"). Termina en `/exec`.
5. Pega esa URL en la constante `WEB_APP_URL` de:
   - `play.html`
   - `live/host.html`
   - `live/join.html`

Este es el mismo patrón (POST en texto plano + Apps Script Web App) que ya
usaste en tu app de asistencia — evita el problema de CORS sin necesitar
servidor propio.

## 1.5. Probar en tu computador antes de publicar

Los navegadores bloquean la carga de los archivos JSON de contenido cuando
abres `index.html` directamente con doble clic (protocolo `file://`). El
menú se ve bien, pero al jugar se queda en pantalla negra.

Para probar en tu propia máquina sin depender de GitHub Pages:

1. Extrae el zip completo (no lo ejecutes desde dentro del zip).
2. Dentro de la carpeta `huawei-gamify`, dale doble clic a
   `iniciar-servidor.bat`.
   - Si tienes Python instalado, se abrirá solo tu navegador en
     `http://localhost:8080` con el juego funcionando normal.
   - Si no tienes Python, el script te avisa e instala Python
     (https://www.python.org/downloads/, marcando "Add Python to PATH")
     o usa la extensión "Live Server" de VS Code como alternativa.
3. Deja esa ventana de la consola abierta mientras pruebas; ciérrala cuando
   termines.

Este paso es solo para pruebas locales — una vez subas la carpeta a GitHub
Pages, el problema desaparece solo porque ya no estarás usando `file://`.

## 2. Publicar en GitHub Pages

Puedes subir esta carpeta tal cual a un repositorio en tu cuenta
`HuaweIFFmanagement`, junto a tus otras herramientas (`Attendfollowup/`,
`Calculadora/`, etc.), y activar GitHub Pages. No requiere build ni npm.

## 3. Agregar un juego nuevo

No necesitas tocar el motor. Solo:

1. Crea un archivo `content/nombre-del-juego.json` con esta forma:

```json
{
  "id": "identificador-unico",
  "title": "Título visible",
  "intro": { "eyebrow": "...", "story": "...", "cta": "Empezar" },
  "levels": [
    {
      "id": "nivel-1",
      "name": "Nombre del nivel",
      "type": "narrative | mission",
      "fragment": "A",            // solo si type = mission
      "intro": "Texto de introducción del nivel",
      "cta": "Empezar nivel",
      "outro": "Texto al superar el nivel",
      "questions": [
        {
          "prompt": "Pregunta",
          "options": [
            { "text": "Opción", "correct": true, "feedback": "Retroalimentación tipo diálogo" }
          ]
        }
      ]
    }
  ],
  "ending": { "eyebrow": "...", "title": "...", "story": "..." }
}
```

2. Agrega una línea al catálogo `CATALOG` dentro de `index.html`.

Cuando me compartas el insumo (temas, preguntas, objeciones, historia), yo te
genero directamente ese archivo JSON con el contenido real — tú solo lo subes.

## 4. Modos de juego

- **Asíncrono / individual** (`play.html`): cada quien juega a su ritmo,
  como las piezas de Genially. Ideal para repaso autoguiado.
- **En vivo / grupal** (`live/host.html` + `live/join.html`): el anfitrión
  genera un código de 4 caracteres, lo comparte (pantalla, WhatsApp o QR), y
  ve un ranking que se actualiza cada 4 segundos a medida que los jugadores
  van terminando — el equivalente a la pantalla de resultados de Kahoot,
  construido sobre Sheets en vez de un servidor de tiempo real.

## 5. Análisis de resultados

Cada partida (individual o en vivo) queda como una fila en la pestaña
"Resultados" del Sheet, con: jugador, rol, juego, score, % de acierto, tiempo
total y un detalle JSON pregunta por pregunta (`log`). Desde ahí puedes:

- Conectar el Sheet directo a Power BI (igual que ya haces con `Dash_So___Inv.pbix`).
- Abrir la columna `log` para ver, pregunta por pregunta, qué tema generó más
  error — útil para detectar qué reforzar en la próxima capacitación.
- Filtrar por `sessionCode` para comparar el desempeño de un grupo que jugó
  en vivo el mismo día.

Puedo ayudarte a construir ese dashboard de análisis (ranking por supervisor,
% de acierto por pregunta, tasa de finalización) en cuanto tengas datos
reales cargados — con el mismo estilo de tus reportes SMR.

## Próximos pasos sugeridos

- [ ] Desplegar `backend/Code.gs` y pegar la URL en los 3 archivos.
- [ ] Reemplazar `content/demo-hibrido.json` por tu primer juego real (dame
      el insumo: tema, preguntas, objeciones, storyline).
- [ ] Subir a GitHub Pages junto a tus otras herramientas.
- [ ] Cuando haya datos, construimos el dashboard de análisis.
