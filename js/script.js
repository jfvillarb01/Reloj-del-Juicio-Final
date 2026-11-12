'use strict';

// Activamos los plugins de Day.js y el idioma español
dayjs.extend(dayjs_plugin_customParseFormat); // permite parsear con un formato concreto
dayjs.extend(dayjs_plugin_duration);          // permite trabajar con duraciones
dayjs.extend(dayjs_plugin_utc);               // necesario para el plugin timezone
dayjs.extend(dayjs_plugin_timezone);          // permite convertir a otras zonas horarias
dayjs.locale('es');

// ==================================================
// PUNTO 1: EDAD EN COSAS RARAS
// ==================================================

// Cuenta los viernes 13 entre el nacimiento y hoy, ambos días incluidos
function contarViernes13(nacimiento, hoy) {
  let total = 0;
  let mes = nacimiento.startOf('month'); // empezamos en el mes del nacimiento

  // Recorremos mes a mes hasta llegar al mes actual
  while (!mes.isAfter(hoy, 'month')) {
    const dia13 = mes.date(13); // el día 13 de ese mes

    // Cuenta si es viernes (5) y está dentro del rango nacimiento-hoy
    if (
      dia13.day() === 5 &&
      !dia13.isBefore(nacimiento, 'day') &&
      !dia13.isAfter(hoy, 'day')
    ) {
      total++;
    }
    mes = mes.add(1, 'month'); // pasamos al mes siguiente
  }
  return total;
}

// Calcula todos los datos de la edad a partir de los segundos vividos
function calcularEdad(nacimiento, ahora) {
  const segundos = ahora.diff(nacimiento, 'second');
  return {
    segundos,
    horas: Math.floor(segundos / 3600), // 1 hora = 3600 s
    dias: Math.floor(segundos / 86400), // 1 día = 24 horas = 86400 s
    diaSemana: nacimiento.format('dddd'), // nombre del día en español
    viernes13: contarViernes13(nacimiento, ahora)
  };
}

// Escribe los resultados en pantalla y los hace visibles
function mostrarEdad(datos) {
  document.getElementById('dias-edad').textContent = datos.dias;
  document.getElementById('horas-edad').textContent = datos.horas;
  document.getElementById('segundos-edad').textContent = datos.segundos;
  document.getElementById('dia-semana').textContent = datos.diaSemana;
  document.getElementById('viernes').textContent = datos.viernes13;
  document.getElementById('resultado-edad').hidden = false;
}

// Se ejecuta al pulsar "Calcular": valida la fecha y muestra resultado o error
function procesarFormularioEdad(evento) {
  evento.preventDefault(); // evita que el formulario recargue la página

  const entrada = document.getElementById('nacimiento');
  const error = document.getElementById('error-edad');
  const resultado = document.getElementById('resultado-edad');

  // Partimos de un estado limpio: sin error y sin resultados anteriores
  error.textContent = '';
  entrada.removeAttribute('aria-invalid');
  resultado.hidden = true;

  let mensaje = '';
  let nacimiento = null;
  const ahora = dayjs(); // se fija al pulsar, así los resultados no cambian solos

  if (!entrada.value) {
    mensaje = 'Introduce tu fecha de nacimiento.'; // campo vacío
  } else {
    // Parseo estricto: crea la fecha a las 00:00 en hora local
    nacimiento = dayjs(entrada.value, 'YYYY-MM-DD', true);
    if (!nacimiento.isValid()) {
      mensaje = 'La fecha de nacimiento no es válida.';
    } else if (nacimiento.isAfter(ahora)) {
      mensaje = 'La fecha de nacimiento no puede ser futura.';
    }
  }

  // Si hay error, lo mostramos y no calculamos nada
  if (mensaje) {
    error.textContent = mensaje;
    entrada.setAttribute('aria-invalid', 'true');
    return;
  }

  mostrarEdad(calcularEdad(nacimiento, ahora));
}

// Conecta el formulario con su función
function iniciarEdad() {
  document.getElementById('form-edad').addEventListener('submit', procesarFormularioEdad);
}

// ==================================================
// PUNTO 2: CUENTA ATRÁS
// ==================================================

let objetivo = null;     // fecha de destino (próximo 1 de enero a las 00:00)
let temporizador = null; // id del setInterval, para poder pararlo al llegar

// Convierte una duración en días totales, horas, minutos y segundos
function descomponerDuracion(duracion) {
  return {
    dias: Math.floor(duracion.asDays()), // días totales
    horas: duracion.hours(),             // 0-23
    minutos: duracion.minutes(),         // 0-59
    segundos: duracion.seconds()         // 0-59
  };
}

// Se ejecuta cada segundo: recalcula lo que falta y lo muestra
function actualizarCuentaAtras() {
  const contador = document.getElementById('contador');
  const diferencia = objetivo.diff(dayjs()); // milisegundos hasta el destino

  // Si ya llegó: paramos el contador y dejamos el mensaje fijo (sin negativos)
  if (diferencia <= 0) {
    clearInterval(temporizador);
    contador.textContent = '¡El evento ha llegado!';
    return;
  }

  // Redondeamos hacia arriba al segundo para no marcar 0 antes de tiempo
  const duracion = dayjs.duration(Math.ceil(diferencia / 1000) * 1000);
  const { dias, horas, minutos, segundos } = descomponerDuracion(duracion);

  contador.textContent =
    `Faltan ${dias} días, ${horas} horas, ${minutos} minutos y ${segundos} segundos para Año Nuevo`;
}

// Calcula el destino una sola vez al cargar y arranca el contador
function iniciarCuentaAtras() {
  const anio = dayjs().year() + 1;                // año del próximo 1 de enero
  objetivo = dayjs(new Date(anio, 0, 1, 0, 0, 0)); // 1 de enero, 00:00 hora local

  // Nombre del evento y su fecha
  document.getElementById('fecha-evento').textContent =
    `Año Nuevo: ${objetivo.format('D [de] MMMM [de] YYYY, HH:mm')} (hora local)`;

  actualizarCuentaAtras();                            // primera pintada inmediata
  temporizador = setInterval(actualizarCuentaAtras, 1000); // y luego cada segundo
}

// ==================================================
// PUNTO 3: ZONAS HORARIAS
// ==================================================

// Muestra la hora actual en tu zona y en Tokio, Nueva York y Sídney
function actualizarZonasHorarias() {
  const ahora = dayjs();
  const formato = 'dddd D MMM, HH:mm:ss';

  document.getElementById('hora-local').textContent = ahora.format(formato);
  document.getElementById('hora-londres').textContent = ahora.tz('Europe/London').format(formato);
  document.getElementById('hora-nueva-york').textContent = ahora.tz('America/New_York').format(formato);
  document.getElementById('hora-sidney').textContent = ahora.tz('Australia/Sydney').format(formato);

}

// ==================================================
// INICIO Y ACTUALIZACIÓN COMÚN
// ==================================================

function actualizarRelojes() {
  actualizarCuentaAtras();
  actualizarZonasHorarias();
}

iniciarEdad();
iniciarCuentaAtras();

// Ejecutamos la función nada más empezar y creamos un intervalo
actualizarRelojes();
// Un intervalo permite ejecutar una función cada x segundos (1000ms == 1seg)
setInterval(actualizarRelojes, 1000);

