# Acuario Virtual 2D Inteligente

Version `1.3.0`.

Simulador web estilo Tamagotchi de un acuario 2D de agua dulce. El usuario controla el ecosistema desde un chat en lenguaje natural; el backend interpreta intenciones con Ollama y mantiene la simulacion, persistencia, tiempo, calidad del agua, hambre, crecimiento, reproduccion y compatibilidad de especies.

## Inicio rapido en Codespaces

Desde la raiz del repositorio:

```bash
npm start
```

Ese script ejecuta `scripts/start-codespace.sh` y hace lo necesario para levantar todo:

- Instala `zstd` si falta.
- Instala Ollama si falta.
- Inicia `ollama serve`.
- Descarga el modelo configurado, por defecto `qwen2.5-coder:3b`.
- Instala dependencias del backend si falta `node_modules`.
- Arranca el servidor en `http://localhost:3000`.

Para usar otro modelo:

```bash
OLLAMA_MODEL=phi3 npm start
```

## Arranque manual

Instalar Ollama en Linux/Codespaces:

```bash
sudo apt-get update && sudo apt-get install -y zstd
curl -fsSL https://ollama.com/install.sh | sh
ollama serve > ollama.log 2>&1 &
ollama pull qwen2.5-coder:3b
```

Arrancar solo el backend:

```bash
cd backend
npm install
npm start
```

Abrir `http://localhost:3000`.

## Estructura

```text
backend/
  server.js          Express + Socket.io
  gameEngine.js      Simulacion del ecosistema
  llmService.js      Intenciones con Ollama + fallback local
  persistence.js     Guardado/carga del estado
frontend/
  index.html         Interfaz principal
  style.css          Layout visual
  script.js          Canvas, sockets y controles
scripts/
  start-codespace.sh Arranque completo con Ollama
```

## Persistencia

El estado se guarda en `backend/data/aquarium-state.json`.

Ese directorio esta en `.gitignore`, por lo que:

- Se conserva si vuelves al mismo Codespace.
- Se conserva al reiniciar el servidor.
- Se pierde si borras el Codespace o creas uno nuevo desde cero.

Reiniciar partida:

```bash
rm -f backend/data/aquarium-state.json
```

## Interfaz

- La pecera ocupa la mayor parte de la pantalla.
- El panel flotante muestra tiempo y calidad del agua.
- El panel flotante se puede ocultar/mostrar para ver mejor el acuario.
- El chat tiene scroll y acepta lenguaje natural.
- Escribe `menu` para abrir el arbol maestro de ayuda.
- `menu` no pasa por el LLM: responde directo desde el backend.
- Usa `especies`, `inventario`, `ideas` o `estado` para secciones especificas.
- Escribe `lista`, `inventario`, `habitantes` o `que peces tengo` para ver lo que vive en el acuario por categorias.

## Tiempo

Por defecto, `60` segundos reales equivalen a `1` hora del juego.

Velocidades del panel y chat:

- `pausado`: congela el paso del tiempo.
- `lento`: media velocidad.
- `normal`: velocidad base.
- `rapido`: acelera el ecosistema.
- `muy_rapido`: acelera mucho para observar cambios.

Ejemplos:

- `pausa el acuario`
- `pon el tiempo rapido`
- `vuelve a velocidad normal`
- `ponlo muy rapido`

## Calidad del agua

El panel muestra:

- Salud general.
- Amonio.
- Nitritos.
- Nitratos.
- Oxigeno.
- Estado del filtro.
- Estado de oxigenacion.

Reglas principales:

- Los animales vivos producen desechos.
- Los muertos empeoran el agua si no se retiran o consumen.
- Sobrealimentar deja comida que sube nutrientes y puede afectar el agua.
- El filtro convierte amonio en nitritos y luego en nitratos.
- Plantas y algas consumen parte de los nitratos.
- Si la salud del agua baja mucho, los animales se estresan y empeoran mas rapido.

Consulta por chat:

- `como esta la calidad del agua`
- `revisa el agua`
- `estado del acuario`

## Especies

Peces de agua dulce:

- `neon`: Paracheirodon innesi, pequeno y rapido.
- `guppy`: Poecilia reticulata, comunitario y reproductivo.
- `betta`: Betta splendens, territorial.
- `molly`: Poecilia sphenops, comunitario resistente.
- `angel`: Pterophyllum scalare, tambien llamado escalar.
- `cebra`: Danio rerio, danio cebra activo.
- `corydora`: pez de fondo pacifico.
- `platy`: pez comunitario colorido.
- `xipho`: cola de espada.
- `otocinclus`: pequeno comealgas.

Caracoles:

- `neritina`: comedor de algas.
- `manzana`: caracol grande.
- `planorbis`: caracol pequeno y reproductivo.

Gambas:

- `cherry`: gamba roja pequena.
- `amano`: gamba resistente.
- `fantasma`: gamba clara/translucida.

Plantas reales:

- `anubia`: crecimiento lento.
- `ambulia`: crecimiento mas rapido y alto.

Algas, separadas de plantas:

- `verde`: alga baja que consume nitratos.
- `filamentosa`: alga alta que consume mas nitratos.

Las algas no cuentan como plantas en la interfaz porque son otra categoria del ecosistema.

## Compatibilidad

El motor puede rechazar compras si el ecosistema no conviene.

Reglas actuales:

- Maximo biologico aproximado: `45` animales.
- Si la calidad del agua es baja, no se agregan animales nuevos.
- Solo un `betta` por acuario.
- `betta` no se permite con `guppy`.
- `betta` puede atacar gambas pequenas (`cherry`, `fantasma`).
- `angel` adulto puede depredar `neon`, `cherry` o `fantasma`.
- `betta` y `angel` no son excluyentes entre si en esta simulacion, pero ambos requieren vigilar compatibilidad con especies pequenas.

Si una compra se rechaza, el chat explica el motivo.

## Alimentacion, limpieza y algas

Alimentar:

- `alimenta el acuario`
- `dar de comer a los peces`
- `pon comida`

Limpiar muertos manualmente:

- `limpia los muertos`
- `retira los cadaveres`
- `saca los animales muertos`

Limpieza natural:

- Caracoles y gambas vivos buscan cadaveres cercanos.
- Al consumirlos, reducen su hambre y convierten parte en nutrientes.
- Caracoles y gambas tambien pueden pastar algas.

## Reproduccion

Puede ocurrir automaticamente si el ecosistema esta estable.

Especies reproductivas actuales:

- `guppy`.
- `cherry`.
- `planorbis`.

Condiciones generales:

- Al menos dos individuos vivos de la especie.
- Buena calidad del agua.
- Oxigeno suficiente.
- Hambre baja.
- Tiempo minimo desde la ultima cria.
- Capacidad disponible en el acuario.

## Comandos de chat

Ayuda:

- `menu`
- `help`
- `ideas`
- `ayuda`
- `comandos`
- `?`

Listado del acuario:

- `lista`
- `inventario`
- `habitantes`
- `que peces tengo`
- `que animales hay`

Catalogo de especies:

- `especies`
- `catalogo`
- `disponibles`

Estado rapido:

- `estado`
- `agua`
- `calidad`

Comprar peces:

- `agrega dos neones`
- `quiero un betta`
- `compra dos mollys y un otocinclus`
- `agrega un pez angel`
- `pon tres danios cebra`

Invertebrados:

- `agrega gambas cherry`
- `compra un caracol neritina`
- `pon dos caracoles planorbis`

Plantas y algas:

- `agrega una anubia`
- `pon tres ambulias`
- `agrega algas verdes`
- `pon alga filamentosa`

Ecosistema:

- `alimenta el acuario`
- `limpia los muertos`
- `como esta la calidad del agua`
- `pon el tiempo rapido`
- `pausa el acuario`

## Notas de desarrollo

- El LLM interpreta el chat, pero el movimiento, hambre, agua, crecimiento, compatibilidad y reproduccion los maneja el backend.
- Si Ollama no responde, existe un fallback local basico para comandos comunes.
- No se deben versionar `backend/data/`, logs, `.env` ni `node_modules`.
