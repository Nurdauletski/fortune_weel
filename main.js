const wheel = document.querySelector(".wheel");
const labelsContainer = document.getElementById("labels");
const center = document.querySelector(".center");
const segmentsInput = document.getElementById("segmentsInput");
const updateBtn = document.getElementById("updateBtn");
const durationInput = document.getElementById("durationInput");
// Укажи правильный путь к файлу, который ты скачал
const spinSound = new Audio("./public/audio.mp3");
// Находим элементы модалки
const modalWrapper = document.querySelector(".modal_wrapper");
const modalTitle = modalWrapper.querySelector("h2");
const reloadBtn = modalWrapper.querySelector("button");

// Если хочешь, чтобы звук зацикливался, пока крутится колесо:
spinSound.loop = true;

let currentRotation = 0;
let isSpinning = false;
let totalSegments = parseInt(segmentsInput.value);
let spinDuration = parseInt(durationInput.value) || 5;

const colors = ["#b42d1d", "#111"];
const specialColor = "#0d7c4a";

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
    const startAngle = i * degreesPerSegment;
    const endAngle = (i + 1) * degreesPerSegment;
    gradientSteps.push(`${color} ${startAngle}deg ${endAngle}deg`);

    // 2. Создаем элемент
    const label = document.createElement("div");
    label.className = "label";
    label.innerText = i + 1;

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

  spinDuration = parseInt(durationInput.value) || 5; // Берем время кручения
  const durationMs = spinDuration * 1000; // Переводим в миллисекунды для setTimeout
  // Устанавливаем начальный transition, чтобы при первом же клике всё сработало
  wheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.15, 0, 0.15, 1)`;
  spinSound.currentTime = 0; // Сбрасываем звук на начало
  spinSound.play();

  // 1. Генерируем случайный индекс сегмента
  const randomSegmentIndex = Math.floor(Math.random() * totalSegments);

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
    spinSound.pause();

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

    // ОБНОВЛЯЕМ МОДАЛКУ И ПОКАЗЫВАЕМ
    modalTitle.innerText = `Играем вопрос сектора ${winningNumber}`;
    modalWrapper.classList.add("active");
  }, durationMs);
});

reloadBtn.addEventListener("click", () => {
  modalWrapper.classList.remove("active");
  // Можно автоматически сбросить колесо, если хочешь:
  // wheel.style.transform = `rotate(0deg)`;
  // currentRotation = 0;
});

// Первый запуск
initWheel();
