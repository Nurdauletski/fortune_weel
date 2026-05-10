const wheel = document.querySelector(".wheel");
const labelsContainer = document.getElementById("labels");
const center = document.querySelector(".center");
const segmentsInput = document.getElementById("segmentsInput");
const updateBtn = document.getElementById("updateBtn");
const durationInput = document.getElementById("durationInput");
// --- ДОБАВЛЯЕМ ПЕРЕМЕННУЮ ДЛЯ ХРАНЕНИЯ ПРЕДЫДУЩЕГО ВЫИГРЫША --- //
let lastWinningSegmentIndex = null;

// Укажи правильный путь к файлу, который ты скачал
const spinSound = new Audio("./public/myaudio.mp3");

// Находим элементы модалки
const modalWrapper = document.querySelector(".modal_wrapper");
const modalTitle = modalWrapper.querySelector("h2");
const reloadBtn = modalWrapper.querySelector("button");

// Находим стрелку
const arrow = document.querySelector(".pointer"); // убедись, что класс совпадает с HTML

let step = parseInt(document.getElementById("stepInput").value);
// const step = 3;

// Если хочешь, чтобы звук зацикливался, пока крутится колесо:
// spinSound.loop = true;
let fadeInterval = null; // Будет хранить ID таймера затухания

let currentRotation = 0;
let isSpinning = false;
let totalSegments = parseInt(segmentsInput.value);
let spinDuration = parseInt(durationInput.value) || 5;

const colors = ["#b42d1d", "#111"];
const specialColor = "#0d7c4a";
const borderColor = "#d1a34f"; // Цвет границы (например, золотой, как рама) // <--- ДОБАВЛЕНО
const borderWidthDegrees = 1.2; // Ширина границы в градусах (подбери на глаз) // <--- ДОБАВЛЕНО

// Функция для плавного затухания звука
// function fadeOutSound(audioElement, durationMs) {
//   if (fadeInterval) clearInterval(fadeInterval);

//   const step = 0.05;
//   const intervalTime = durationMs * step;

//   fadeInterval = setInterval(() => {
//     if (audioElement.volume > step) {
//       audioElement.volume -= step;
//     } else {
//       audioElement.volume = 0;
//       audioElement.pause();
//       clearInterval(fadeInterval);
//       fadeInterval = null;
//       audioElement.volume = 1;
//     }
//   }, intervalTime);
// }

function initWheel() {
  labelsContainer.innerHTML = "";

  const degreesPerSegment = 360 / totalSegments;
  let gradientSteps = [];

  // Радиус, на котором висят цифры (настрой под себя)
  const labelRadius = 170;

  for (let i = 0; i < totalSegments; i++) {
    // 1. Цвета и градиент (остаются как были)
    let color = colors[i % colors.length];
    if (i === 0) color = specialColor;
    const startColorAngle = i * degreesPerSegment + borderWidthDegrees / 2; // <--- ИЗМЕНЕНО
    const endColorAngle = (i + 1) * degreesPerSegment - borderWidthDegrees / 2; // <--- ИЗМЕНЕНО
    gradientSteps.push(`${color} ${startColorAngle}deg ${endColorAngle}deg`);
    const startAngle = i * degreesPerSegment;
    const endAngle = (i + 1) * degreesPerSegment;
    gradientSteps.push(`${color} ${startColorAngle}deg ${endColorAngle}deg`);

    // 2. Добавляем тонкую полоску границы ПОСЛЕ этой секции
    const endBorderAngle = (i + 1) * degreesPerSegment + borderWidthDegrees / 2; // <--- ДОБАВЛЕНО
    gradientSteps.push(
      `${borderColor} ${endColorAngle}deg ${endBorderAngle}deg`,
    ); // <--- ДОБАВЛЕНО
    // 2. Создаем элемент
    const label = document.createElement("div");
    label.className = "label";
    const segmentNumber = i + 1;

    if (segmentNumber % step === 0) {
      label.innerText = segmentNumber;
    } else {
      label.innerText = " ";
    }

    // 3. МАТЕМАТИЧЕСКАЯ КОРРЕКЦИЯ
    // Находим центр сектора в градусах
    const midAngleDegrees = startAngle + degreesPerSegment / 2;

    // ВАЖНО: Вычитаем 90 градусов, чтобы 0° стал "вершиной" колеса,
    // как это делает conic-gradient в CSS по умолчанию.
    const correctedAngleRadians = (midAngleDegrees - 90) * (Math.PI / 180);

    // 4. Вычисляем координаты X и Y
    const x = labelRadius * Math.cos(correctedAngleRadians);
    const y = labelRadius * Math.sin(correctedAngleRadians);

    // 5. Позиционируем через CSS переменные или прямой стиль
    label.style.left = "50%";
    label.style.top = "50%";

    // translate(-50%, -50%) центрирует сам блок цифры в точке (x, y)
    label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

    // Динамический размер шрифта
    const fontSize = Math.max(12, 26 - totalSegments / 1.5);
    label.style.fontSize = `${fontSize}px`;

    labelsContainer.appendChild(label);
  }

  wheel.style.background = `conic-gradient(${gradientSteps.join(", ")})`;
}

// Кнопка обновления
updateBtn.addEventListener("click", () => {
  if (isSpinning) return;

  totalSegments = parseInt(segmentsInput.value);
  spinDuration = parseInt(durationInput.value) || 5; // Считываем новое время
  step = parseInt(document.getElementById("stepInput").value);
  currentRotation = 0;

  // 1. Временно убираем анимацию (transition)
  wheel.style.transition = "none";

  // 2. Мгновенно сбрасываем угол
  wheel.style.transform = `rotate(0deg)`;

  // 3. Перерисовываем секции и цифры
  initWheel();

  // 4. Возвращаем анимацию назад через мизерную паузу,
  // чтобы следующее вращение снова было плавным
  setTimeout(() => {
    isSpinning = false;

    // --- ОСТАНОВКА ЗВУКА ---
    // Плавно затухает или просто прерывается:
    spinSound.pause();
  }, 50);
});

// Логика клика по центру (твоя старая логика)
center.addEventListener("click", () => {
  if (isSpinning) return;
  isSpinning = true;
  // --- ДОБАВЬТЕ ЭТИ СТРОКИ ПЕРЕД play() ---
  if (fadeInterval) {
    clearInterval(fadeInterval); // Останавливаем затухание, если оно шло
    fadeInterval = null;
  }
  spinSound.volume = 1; // Возвращаем громкость в максимум

  // 1. Включаем "скольжение" стрелки
  arrow.classList.add("animate");

  spinDuration = parseInt(durationInput.value) || 5; // Берем время кручения
  const durationMs = spinDuration * 1000; // Переводим в миллисекунды для setTimeout
  // Устанавливаем начальный transition, чтобы при первом же клике всё сработало
  wheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.15, 0, 0.15, 1)`;
  spinSound.currentTime = 0; // Сбрасываем звук на начало
  spinSound.play();

  let randomSegmentIndex;

  do {
    // 1. Генерируем случайный индекс сегмента
    randomSegmentIndex = Math.floor(Math.random() * totalSegments);

    // 2. Проверяем: равен ли он предыдущему?
  } while (randomSegmentIndex === lastWinningSegmentIndex); // <--- ИЗМЕНЕНО

  // Как только цикл прервался, значит мы нашли новый уникальный индекс.
  // Запоминаем его для следующего раза.
  lastWinningSegmentIndex = randomSegmentIndex; // <--- ДОБАВЛЕНО

  // 2. Считаем параметры шага
  const degreesPerSegment = 360 / totalSegments;

  // 3. Вычисляем целевой угол.
  // Мы берем (индекс * шаг) и добавляем (шаг / 2),
  // чтобы стрелка смотрела ровно в центр сектора.
  const targetAngle =
    randomSegmentIndex * degreesPerSegment + degreesPerSegment / 2;

  // 4. Красивое вращение
  const spins = (Math.floor(Math.random() * 5) + 5) * 360;

  // 5. РАСЧЕТ ОСТАНОВКИ (Корректировка под верхнюю стрелку)
  // Поскольку начало координат (0°) у нас теперь совпадает со стрелкой наверху,
  // нам нужно просто вычесть целевой угол из общего круга.
  const stopAt = spins + ((360 - targetAngle) % 360);

  // Накопительный поворот (чтобы колесо не крутилось назад)
  currentRotation += 360 - (currentRotation % 360) + stopAt;

  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    isSpinning = false;

    // 2. Выключаем анимацию стрелки при остановке
    arrow.classList.remove("animate");
    // spinSound.pause();

    // 1. Получаем текущий угол поворота колеса (от 0 до 360)
    // Мы используем fmod-подобную логику, чтобы угол всегда был положительным
    const actualRotation = currentRotation % 360;

    // 2. Вычисляем "угол встречи" со стрелкой наверху.
    // Поскольку 0-й сектор у нас отрисован сверху, нам нужно понять,
    // какой сегмент пришел в точку 270 градусов (или -90) относительно начала координат.
    // Формула: (360 - остаток_поворота) даст нам угол "головы" колеса.
    const winningAngle = (360 - actualRotation) % 360;

    // 3. Находим индекс сегмента
    const degreesPerSegment = 360 / totalSegments;

    // Добавляем 1, так как индекс начинается с 0, а наши цифры с 1
    const winningNumber = Math.floor(winningAngle / degreesPerSegment) + 1;

    // --- ПЛАВНАЯ ОСТАНОВКА ЗВУКА ВМЕСТО ОБЫЧНОЙ ---

    // ОБНОВЛЯЕМ МОДАЛКУ И ПОКАЗЫВАЕМ
    modalTitle.innerText = `Играем вопрос номер ${winningNumber}`;
    modalWrapper.classList.add("active");
  }, durationMs);
});

reloadBtn.addEventListener("click", () => {
  modalWrapper.classList.remove("active");
});

// Первый запуск
initWheel();
