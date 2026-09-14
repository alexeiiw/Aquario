# Acuario Virtual 2D Inteligente

Version `1.2.0`.

Simulador web estilo Tamagotchi con acuario 2D de agua dulce, chat lateral, backend Node.js y motor de intenciones con Ollama.

## Requisitos

- Node.js 20+
- Ollama instalado y ejecutándose en `http://localhost:11434`
- Modelo recomendado: `qwen2.5-coder:3b`

## Ejecutar localmente

Desde la raiz del repositorio en Codespaces puedes arrancar todo con:

```bash
npm start
```

Ese comando instala `zstd` si falta, instala Ollama si falta, inicia Ollama, descarga el modelo configurado, instala dependencias del backend y arranca el servidor.

Arranque manual del backend:

```bash
cd backend
npm install
npm start
```

Abrir `http://localhost:3000`.

## Ollama

En Codespaces o Linux:

```bash
sudo apt-get update && sudo apt-get install -y zstd
curl -fsSL https://ollama.com/install.sh | sh
ollama serve > ollama.log 2>&1 &
ollama pull qwen2.5-coder:3b
```

Si estas en la raiz del repositorio en Codespaces, instala y ejecuta el backend asi:

```bash
cd backend
npm install
npm start
```

Puedes cambiar el modelo con la variable de entorno:

```bash
OLLAMA_MODEL=qwen2.5-coder:3b npm start
```

## Persistencia

El estado del acuario se guarda automáticamente en `backend/data/aquarium-state.json`. Esa carpeta está ignorada por Git para evitar subir partidas locales.

Si quieres reiniciar la partida en Codespaces, detén el servidor y borra ese archivo:

```bash
rm -f backend/data/aquarium-state.json
```

## Especies de agua dulce y tiempo

La interfaz tiene un panel de ecosistema al lado del acuario con controles de tiempo y calidad del agua.
Ese panel se puede ocultar o mostrar desde el boton del propio panel para ver mejor el acuario.

Velocidades disponibles:

- `pausado`: congela el paso del tiempo.
- `lento`: avanza a media velocidad.
- `normal`: velocidad base.
- `rapido`: acelera el ecosistema.
- `muy_rapido`: acelera mucho para observar crecimiento y cambios.

Tambien puedes cambiar la velocidad por chat:

- `pon el tiempo rapido`
- `pausa el acuario`
- `vuelve a velocidad normal`

Calidad del agua visible en panel:

- Amonio.
- Nitritos.
- Nitratos.
- Oxigeno.
- Salud general del agua.

El acuario empieza con filtro y oxigenacion activos. El filtro convierte amonio en nitritos y luego nitratos. Las plantas y algas consumen parte de los nitratos. Si la salud del agua baja mucho, los animales se estresan y empeoran mas rapido.

Peces disponibles:

- `neon`: pez pequeño, hambre baja, crecimiento rapido.
- `guppy`: pez mediano, hambre moderada, crecimiento estandar.

Caracoles disponibles:

- `neritina`: caracol de agua dulce comedor de algas.
- `manzana`: caracol grande de agua dulce.
- `planorbis`: caracol pequeno de agua dulce.

Gambas disponibles:

- `cherry`: gamba roja de agua dulce.
- `amano`: gamba resistente y activa.
- `fantasma`: gamba clara/translucida.

Plantas disponibles:

- `anubia`: crecimiento lento y resistente.
- `ambulia`: crecimiento mas rapido y alto.

Algas disponibles, agregadas solo cuando las pides:

- `verde`: alga baja que consume nitratos y sirve de alimento natural.
- `filamentosa`: alga mas alta que consume mas nitratos.

Caracoles y gambas pueden pastar algas y reducirlas con el tiempo.

Por defecto, `60` segundos reales equivalen a `1` hora del juego. Puedes cambiarlo antes de iniciar el servidor:

```bash
REAL_SECONDS_PER_GAME_HOUR=120 npm start
```

El contador de peces e invertebrados muestra `vivos/total`. Si ves `0/2`, esos animales murieron por hambre y ya no se moveran.

Para retirar animales muertos del acuario, escribe en el chat:

- `limpia los muertos`
- `retira los cadaveres`
- `saca los animales muertos`

Los caracoles y gambas tambien cumplen una funcion natural de limpieza: si hay cadaveres cercanos, los consumen gradualmente y convierten parte de esa materia en nutrientes para las plantas. La limpieza manual sigue existiendo para retirar muertos de inmediato.

## Compatibilidad y reproduccion

Antes de agregar animales, el motor revisa condiciones basicas del ecosistema. Si el acuario esta saturado o la calidad del agua es baja, la compra puede rechazarse con un mensaje en el chat.

La reproduccion puede ocurrir automaticamente si el ecosistema esta estable:

- Guppys.
- Gambas cherry.
- Caracoles planorbis.

Condiciones generales:

- Al menos dos individuos vivos de la especie.
- Calidad de agua saludable.
- Oxigeno suficiente.
- Hambre baja.
- Tiempo minimo desde la ultima cria.

## Ideas de ampliacion

- Calidad del agua: amonio, nitritos, nitratos, pH y cambios parciales de agua.
- Filtro y oxigenacion: si falla el filtro, sube la toxicidad y baja el oxigeno.
- Algas: aparecen con exceso de nutrientes y sirven de alimento para caracoles/gambas.
- Compatibilidad de especies: peces grandes podrian estresar o comer gambas pequenas.
- Reproduccion: guppys, caracoles planorbis y gambas cherry podrian reproducirse si el ecosistema esta estable.
- Inventario y tienda: dinero, precios, compras y limite de poblacion por tamano del acuario.
- Eventos aleatorios: enfermedad, sobrealimentacion, plantas que sombrean zonas o ciclos de luz.
- Panel de diagnostico: mostrar hambre promedio, animales muertos, calidad del agua y recomendaciones.

## Chat de ejemplo

- `help`
- `ideas`
- `Quiero comprar dos peces neon y una anubia`
- `Agrega tres gambas cherry y un caracol neritina`
- `Compra un caracol manzana y dos gambas amano`
- `Agrega algas verdes`
- `Pon el tiempo muy rapido`
- `Como esta la calidad del agua`
- `Agrega un guppy y alimenta a los peces`
- `Pon tres ambulias en el fondo`
- `Limpia los muertos`
