# Acuario Virtual 2D Inteligente

Version `1.5.0`.

Simulador web estilo Tamagotchi de un acuario 2D de agua dulce. El usuario controla el ecosistema desde un chat; un parser local interpreta comandos en espanol y el backend mantiene la simulacion, persistencia, tiempo, calidad del agua, hambre, crecimiento, reproduccion y compatibilidad de especies.

## Inicio rapido en Codespaces

Desde la raiz del repositorio:

```bash
npm start
```

Ese comando ejecuta directamente el backend y arranca el servidor en `http://localhost:3000`.

El proyecto no inicia Ollama, no descarga modelos y no necesita servicios externos.

## Arranque manual

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
  llmService.js      Parser local de comandos y aclaraciones
  persistence.js     Guardado/carga del estado
frontend/
  index.html         Interfaz principal
  style.css          Layout visual
  script.js          Canvas, sockets y controles
scripts/
  start-codespace.sh Arranque de Node sin servicios externos
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
- Puedes hacer click sobre peces, caracoles o gambas para inspeccionar especie, edad, hambre, estado, tamano y advertencias.
- El panel flotante muestra tiempo y calidad del agua.
- Las maderas se pueden agregar desde el chat y aparecen en el inventario.
- El panel flotante se puede ocultar/mostrar para ver mejor el acuario.
- El chat tiene scroll y acepta lenguaje natural.
- Escribe `menu` para abrir el arbol maestro de ayuda.
- `menu` responde directo desde el backend.
- Usa `especies`, `inventario`, `ideas` o `estado` para secciones especificas.
- Usa `diagnostico` o `alertas` para revisar si el acuario necesita atencion.
- Usa `cambio de agua 30%` para reducir amonio, nitritos y nitratos.
- Escribe `lista`, `inventario`, `habitantes` o `que peces tengo` para ver lo que vive en el acuario por categorias.
- El cuadro de texto muestra comandos frecuentes: `menu`, `especies`, `inventario`, `estado`, `alimentar`, `agrega un...`.

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
- `diagnostico`
- `alertas`

Las alertas tambien aparecen automaticamente en el panel de calidad del agua y en el chat cuando cambian los niveles de riesgo. Una pregunta como `¿el acuario necesita un cambio de agua?` consulta el diagnostico sin ejecutar ninguna accion.

Cambio de agua:

- `cambio de agua`: realiza un cambio del `20%` por defecto.
- `cambio de agua 30%`: permite indicar el porcentaje.
- El motor limita cada cambio entre `5%` y `80%` para evitar cambios extremos.

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
- `rasbora`: rasbora arlequin, pez de cardumen.
- `tetra`: tetra cardenal, pez de cardumen.
- `ramirezi`: pez pequeno territorial que necesita un entorno estable.
- `gourami`: gourami enano, territorial; se mantiene uno por acuario.
- `ancistrus`: pez de fondo y consumidor de algas.

Peces de cardumen:

- `neon`, `cebra`, `rasbora` y `tetra` forman grupos de al menos seis ejemplares.
- Mantienen cohesion, alineacion y separacion mientras nadan.
- Se alejan de peces angel cercanos y se muestran conectados visualmente como grupo.

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
- `rasbora` y `tetra` requieren un cardumen minimo de `6` ejemplares.
- Solo un `betta` por acuario.
- `betta` no se permite con `guppy`.
- `betta` puede atacar gambas pequenas (`cherry`, `fantasma`).
- `angel` adulto puede depredar `neon`, `tetra`, `rasbora`, `cherry` o `fantasma`.
- `gourami` se limita a un ejemplar y no convive con `betta` o `ramirezi`.
- `ramirezi` no se combina con `betta`, `gourami`, `angel` ni otro `ramirezi`.
- `ancistrus` ocupa el espacio de fondo y puede pastar algas.
- Los peces de cardumen requieren al menos `6` ejemplares para agregarse.

Si una compra se rechaza, el chat explica el motivo.

## Alimentacion, limpieza y algas

Alimentar:

- `alimenta el acuario`
- `dar de comer a los peces`
- `pon comida`

Alimento natural del ecosistema:

- `otocinclus`, `ancistrus`, `molly`, `platy` y `xipho` pueden pastar algas.
- `corydora`, `guppy`, `molly`, `platy` y `xipho` pueden aprovechar detrito/biofilm del sustrato si hay nutrientes disponibles.
- Caracoles y gambas pueden comer algas, biofilm, detrito y cadaveres cercanos.
- Plantas y algas ayudan a estabilizar el agua, pero no sustituyen por completo la alimentacion manual.
- Llegar a hambre `100` ya no mata inmediatamente: el animal debe permanecer varias horas de juego en hambruna antes de morir.

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

Las compras de peces e invertebrados registran sexo cuando corresponde. Una compra de `5 guppies` alterna automaticamente hembras y machos (`3` de un sexo y `2` del otro), por lo que puede existir una pareja reproductiva. La reproduccion de guppy y gamba cherry requiere al menos un macho y una hembra; planorbis es hermafrodita.

Condiciones generales:

- Al menos dos individuos vivos de la especie.
- Buena calidad del agua.
- Oxigeno suficiente.
- Hambre baja.
- Tiempo minimo desde la ultima cria.
- Capacidad disponible en el acuario.

Cuando nace una cria, el sistema agrega un mensaje al chat y la cria aparece en el acuario con tamano inicial reducido.

## Plantas, Algas Y Maderas

Las maderas son decoracion funcional del acuario y se agregan con el mismo lenguaje del catalogo:

- `mopani`: madera densa y oscura.
- `manzanita`: rama ramificada.
- `spider`: rama fina y ornamental.
- `cholla`: madera tubular.
- `manglar`: raiz oscura.

Ejemplos:

- `agrega madera mopani`
- `pon dos ramas manzanita`
- `agrega spider`

Los comandos `especies`, `menu` e `inventario` incluyen las maderas disponibles y las maderas colocadas.

## Comandos de chat

El chat se interpreta localmente, sin Ollama ni modelos descargados. La logica normaliza acentos, reconoce alias, plurales, cantidades numericas o escritas y permite varias acciones en un mismo mensaje. Si falta informacion, pregunta antes de ejecutar.

Ejemplos de aclaracion:

- `agrega peces` -> pregunta especie y cantidad.
- `cambia el tiempo` -> pregunta la velocidad.
- `quiero algo nuevo` -> pide que indiques la categoria, especie y cantidad.

Comandos frecuentes recomendados:

- `menu`
- `especies`
- `inventario`
- `estado`
- `ideas`
- `alimentar`
- `diagnostico`
- `alertas`
- `cambio de agua 30%`
- `agrega un betta`
- `agrega madera mopani`

Conversacion guiada:

- `agrega una alga` -> pregunta si deseas alga verde o filamentosa.
- `verde` -> completa la pregunta anterior y agrega el alga.
- `agrega peces` -> pregunta la especie disponible.
- `cambia el tiempo` -> pregunta la velocidad.
- El contexto de aclaracion dura solo durante la conexion actual y se limpia al completar la accion o consultar el menu.

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

Maderas:

- `agrega madera mopani`
- `pon dos ramas manzanita`
- `agrega spider wood`

Ecosistema:

- `alimenta el acuario`
- `limpia los muertos`
- `como esta la calidad del agua`
- `pon el tiempo rapido`
- `pausa el acuario`

## Codespaces y persistencia

No es necesario regenerar el Codespace para recuperar espacio por retirar Ollama: el proyecto ya no instala, inicia ni descarga ningun modelo. Puedes mantener el Codespace actual y reconstruir el contenedor si quieres limpiar dependencias antiguas.

El estado de la partida se guarda en `backend/data/aquarium-state.json`, que no se versiona. Si borras el Codespace, tambien puedes perder ese estado.

## Notas de desarrollo

- El parser local interpreta el chat; el movimiento, hambre, agua, crecimiento, compatibilidad y reproduccion los maneja el backend.
- `backend/llmService.js` conserva su nombre por compatibilidad interna, pero ya no usa un LLM: es un interprete determinista con validacion y aclaraciones.
- No se deben versionar `backend/data/`, logs, `.env` ni `node_modules`.
- La version `1.5.0` incluye cardumen, reproduccion sexuada, maderas, render de maderas, animacion de aletas y mejoras de inspeccion.
