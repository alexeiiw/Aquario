# Acuario Virtual 2D Inteligente

Version `2.0.0`.

Simulador didáctico web estilo Tamagotchi de acuarios 2D de agua dulce y marino. El selector cambia entre dos ecosistemas con partidas, habitantes, parámetros, inventario y chat independientes. Un parser local interpreta comandos y preguntas educativas en español.

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
- En el arrecife puedes inspeccionar peces, invertebrados y corales; la tarjeta explica necesidades y señales educativas.
- El panel flotante muestra tiempo y calidad del agua.
- Las maderas se pueden agregar desde el chat y aparecen en el inventario.
- El panel muestra fase del dia, luz, pH y capacidad del filtro.
- En escritorio, los controles de tiempo y ambiente se muestran lado a lado; la calidad del agua y sus alertas ocupan todo el ancho para que no queden ocultas.
- El panel flotante se puede ocultar/mostrar para ver mejor el acuario.
- El chat tiene scroll y acepta lenguaje natural.
- Escribe `menu` para abrir el arbol maestro de ayuda.
- `menu` responde directo desde el backend.
- Usa `especies`, `inventario`, `ideas` o `estado` para secciones especificas.
- Usa `diagnostico` o `alertas` para revisar si el acuario necesita atencion.
- Usa `cambio de agua 30%` para reducir amonio, nitritos y nitratos.
- Escribe `lista`, `inventario`, `habitantes` o `que peces tengo` para ver lo que vive en el acuario por categorias.
- El cuadro de texto muestra comandos frecuentes: `menu`, `especies`, `inventario`, `estado`, `alimentar`, `agrega un...`.
- El selector `Agua dulce / Marino` cambia entre partidas independientes: habitantes, parámetros, inventario y mensajes se guardan por separado.
- El encabezado del chat y la lista de comandos cambian con el selector para mostrar la ayuda del ecosistema activo.

## Paisaje Vivo

- El acuario combina fondo vegetal, sustrato con grava, rocas y maderas con siluetas y detalles distintos.
- La luz de dia genera rayos suaves; de noche o con la luz apagada, el acuario se atenúa.
- El agua responde visualmente al ecosistema: las maderas aportan un matiz ambar por taninos y una salud baja reduce la claridad.
- El difusor de aire genera burbujas desde un punto del sustrato; su intensidad depende de la capacidad del filtro y desaparece si la oxigenacion esta apagada.
- Particulas suaves, plantas que se mecen y vegetacion de fondo aportan profundidad sin ocultar a los animales.

## Ambiente Sonoro

- El bloque `Ambiente` incluye un sonido local y suave de filtro con burbujas.
- Pulsa `Activar sonido` para iniciarlo. Los navegadores requieren esta interaccion antes de reproducir audio.
- Usa el control de volumen para regularlo o `Silenciar sonido` para detenerlo.
- El sonido se genera en el navegador; no descarga archivos ni requiere servicios externos.
- El volumen elegido se conserva en el navegador para la siguiente visita.

## Modo Marino y Aprendizaje

- El selector `Marino` abre un arrecife independiente; volver a `Agua dulce` conserva intacta la partida dulce.
- El modo marino tiene paisaje de arrecife, peces, invertebrados, corales y controles simulados para skimmer y circulación.
- Las mediciones incluyen salinidad (`ppt`, partes por mil), temperatura (`°C`), alcalinidad (`dKH`) y calcio (`ppm`). Los avisos explican qué significa cada valor y sugieren pasos prudentes.
- Rangos simplificados de aprendizaje: salinidad `33–36 ppt`, temperatura `23–27 °C`, alcalinidad `7–10 dKH`, calcio `380–460 ppm`.
- El filtro empieza en una fase de ciclado didáctica de 72 horas de juego y no permite introducir habitantes antes de completarla. En acuarios reales el ciclado se confirma midiendo amonio y nitrito en cero de forma estable; esperar un plazo fijo no basta.
- Pregunta `¿qué es la salinidad?`, `¿qué significa alcalinidad?`, `¿qué es el calcio?`, `¿qué es un skimmer?` o `¿cómo funciona el ciclado?` para recibir explicaciones.
- La evaporación concentra la sal: para reponer evaporación real se usa agua dulce purificada; para cambios parciales, agua salada preparada con una mezcla específica marina, igualada en temperatura y salinidad.
- El cirujano azul aparece como especie de estudio, pero no se puede agregar al tanque simulado por el espacio que requiere. Las reglas de peces territoriales y corales también se explican en el chat.
- Límite educativo: el arrecife simulado admite como máximo 12 peces e invertebrados. En acuarios reales la capacidad depende del volumen, el equipo y las necesidades de cada especie.
- `¿necesita un cambio de agua?` y `diagnostico` consultan las alertas sin aplicar cambios. `¿cómo hago un cambio de agua?` explica el procedimiento; para ejecutarlo se indica un porcentaje.
- `¿cómo está la salinidad?` muestra las mediciones marinas. Una consulta que incluya `¿necesita` devuelve diagnóstico y no aplica acciones.
- `repón evaporación` practica el rellenado: acerca gradualmente la salinidad al objetivo sin retirar nitratos. Representa reponer con agua dulce purificada, no hacer un cambio parcial.
- Es una simulación educativa, no reemplaza pruebas reales del agua, investigación de compatibilidad ni asesoría para mantener animales reales.

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

Las alertas aparecen automaticamente en el panel de calidad del agua y en el chat cuando cambian los niveles de riesgo. Una pregunta como `¿el acuario necesita un cambio de agua?` consulta el diagnostico sin ejecutar ninguna accion.

Umbrales de alerta actuales:

- Amonio desde `25%`: cambia agua y reduce la comida.
- Nitritos desde `15%`: revisa el filtro y cambia agua.
- Nitratos desde `40%`: conviene cambiar agua.
- Oxigeno menor de `60%`: revisa la oxigenacion.
- Salud general menor de `55%`: no agregues animales nuevos.
- Capacidad del filtro menor de `25%`: limpia el filtro.

Cambio de agua:

- `cambio de agua`: realiza un cambio del `20%` por defecto.
- `cambio de agua 30%`: permite indicar el porcentaje.
- El motor limita cada cambio entre `5%` y `80%` para evitar cambios extremos.
- El cambio reduce amonio, nitritos y nitratos, y aumenta parcialmente el oxigeno.

## Filtro, Luz Y Salud

- El filtro pierde capacidad y acumula carga mientras procesa desechos.
- `limpia el filtro` restaura su capacidad y elimina la carga acumulada.
- `mejora el filtro` recupera parte de la capacidad.
- El dia y la noche modifican el aporte de oxigeno de las plantas.
- La luz puede controlarse con `enciende la luz` y `apaga la luz`.
- Las maderas aportan taninos y reducen gradualmente el pH.
- Cada pez, caracol y gamba tiene salud y estres individuales.
- Mala calidad de agua, hambre y sobrepoblacion aumentan el estres.
- El diagnostico alerta cuando el filtro esta degradado.

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

Catálogo marino de aprendizaje:

- Peces disponibles: pez payaso, gramma real, damisela azul y pez dardo de fuego.
- El cirujano azul se muestra como ejemplo educativo, pero no se puede agregar porque necesita un tanque mucho mayor.
- Invertebrados: gamba limpiadora, cangrejo ermitaño y caracol turbo.
- Corales: zoántido, coral hongo, euphyllia y acropora. Son animales, no plantas; su crecimiento simulado requiere ciclado, luz, circulación y agua estable.

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
- `vallisneria`: planta de fondo alta, de hojas largas y ondulantes; puede alcanzar `190` unidades de altura visual.

Para crear una zona alta de fondo, usa varias vallisnerias, por ejemplo: `pon tres vallisnerias`. Tambien se reconoce `vallis` y `valisneria`.

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
Los huevos se muestran visualmente, incuban durante varias horas de juego y luego eclosionan. El chat avisa cuando aparecen huevos y cuando las crias eclosionan.

## Plantas, Algas Y Maderas

Las maderas son decoracion funcional del acuario y se agregan con el mismo lenguaje del catalogo:

- `mopani`: madera densa y oscura.
- `manzanita`: rama ramificada.
- `spider`: rama fina y ornamental.
- `cholla`: madera tubular.
- `manglar`: raiz oscura.

Ejemplos:

- `agrega madera mopani`
- `limpia el filtro`
- `mejora el filtro`
- `enciende la luz`
- `apaga la luz`
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
- `cambia al acuario marino`
- `cambia al acuario dulce`
- `agrega un pez payaso`
- `agrega un caracol turbo`
- `agrega coral hongo`
- `enciende el skimmer`
- `enciende la circulacion`
- `repón evaporación`
- `¿qué es el ciclado?`
- `¿cómo repongo el agua evaporada?`
- `cambia al acuario marino`

Las respuestas a `menu`, `especies`, `inventario` e `ideas` dependen del modo activo. Las consultas educativas se resuelven antes de interpretar acciones; por ejemplo: `¿qué es el amonio?`, `¿qué significa alcalinidad?`, `¿cómo funciona el ciclado?`.

En modo marino, los cambios requieren porcentaje explícito, como `cambio de agua 10%`; el chat recuerda que el agua real debe prepararse con mezcla marina específica e igualarse en temperatura y salinidad. Para practicar reposición de evaporación usa `repón evaporación`.

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

Comprar peces de agua dulce (solo con modo Agua dulce seleccionado):

- `agrega dos neones`
- `quiero un betta`
- `compra dos mollys y un otocinclus`
- `agrega un pez angel`
- `pon tres danios cebra`

Invertebrados:

- `agrega gambas cherry`
- `compra un caracol neritina`
- `pon dos caracoles planorbis`

Invertebrados marinos (solo con modo Marino seleccionado):

- `agrega una gamba limpiadora`
- `agrega un caracol turbo`
- `agrega un cangrejo ermitaño`

Corales (solo tras el ciclado didáctico):

- `agrega coral hongo`
- `agrega un zoantido`
- `agrega una euphyllia`
- `agrega una acropora`

Plantas y algas:

- `agrega una anubia`
- `pon tres ambulias`
- `pon tres vallisnerias`
- `agrega algas verdes`
- `pon alga filamentosa`

Maderas:

- `agrega madera mopani`
- `pon dos ramas manzanita`
- `agrega spider wood`

Ecosistema:

- `alimenta el acuario`
- `limpia los muertos`
- `limpia el filtro`
- `mejora el filtro`
- `enciende la luz`
- `apaga la luz`
- `como esta la calidad del agua`
- `pon el tiempo rapido`
- `pausa el acuario`
- `repón evaporación` (solo marino; práctica didáctica, no es un cambio parcial de agua)

## Codespaces y persistencia

No es necesario regenerar el Codespace para recuperar espacio por retirar Ollama: el proyecto ya no instala, inicia ni descarga ningun modelo. Puedes mantener el Codespace actual y reconstruir el contenedor si quieres limpiar dependencias antiguas.

El estado de la partida se guarda en `backend/data/aquarium-state.json`, que no se versiona. Si borras el Codespace, tambien puedes perder ese estado.

## Notas de desarrollo

- El parser local interpreta el chat; el movimiento, hambre, agua, crecimiento, compatibilidad y reproduccion los maneja el backend.
- `backend/llmService.js` conserva su nombre por compatibilidad interna, pero ya no usa un LLM: es un interprete determinista con validacion y aclaraciones.
- No se deben versionar `backend/data/`, logs, `.env` ni `node_modules`.
- La version `2.0.0` incorpora el selector de agua dulce/marino con partidas independientes, ayudas y catálogos contextuales, paisaje de arrecife, corales, química marina, ciclado didáctico y explicaciones para aprender ambos ecosistemas.
- La version `2.0.0` cambia el esquema de persistencia sin borrar la partida anterior: el archivo legado se migra al estado dulce y se crea un estado marino separado.
- Los parámetros, ritmos y límites de población del arrecife son simplificaciones educativas; en la vida real se miden y ajustan según el sistema y las especies.
- La version `1.8.0` incorporó un paisaje vivo por capas, sustrato con rocas y grava, maderas diferenciadas, luz y claridad de agua reactivas, burbujeo localizado y vallisneria como planta alta de fondo.
- La version `1.7.0` incorporó el panel de ecosistema en dos columnas y ambiente sonoro opcional de filtro con burbujas.
- Las funciones anteriores incluyen cardumen, reproduccion visual, filtro degradable, salud y estres individual, ciclo dia/noche, efectos de luz y taninos, refugios y comportamiento natural.
