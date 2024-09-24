// Функция для удаления пробелов и форматирования с пробелами
function removeSpaces(value) {
    return value.replace(/\s/g, '');  // Удаление пробелов
}

function formatNumberWithSpaces(value) {
    if (typeof value === 'undefined' || value === null || value === '') {
        return '';  // Возвращаем пустую строку, если значение не определено
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Обновление итогов по всем столбцам
function updateTotals() {
    const table = document.getElementById('accountingTable').getElementsByTagName('tbody')[0];
    const totalRow = table.querySelector('.total-row');

    let totals = Array(11).fill(0);  // Столбцы с 4 по 14 (для расчёта)

    for (let row of table.rows) {
        if (!row.classList.contains('total-row')) {
            for (let i = 3; i <= 14; i++) {
                const cellValue = row.cells[i]?.textContent || '';  // Безопасная проверка, если ячейки нет
                const value = parseFloat(removeSpaces(cellValue)) || 0;
                totals[i - 3] += value;
            }
        }
    }

    for (let i = 3; i <= 14; i++) {
        if (totalRow && totalRow.cells[i]) {  // Проверка наличия строки и ячейки
            totalRow.cells[i].textContent = formatNumberWithSpaces(totals[i - 1]) + ' сум';
        }
    }
}

// Привязывание событий на редактируемые ячейки
function bindCellEvents(cell) {
    cell.addEventListener('input', function () {
        const rawValue = removeSpaces(this.textContent);
        this.textContent = formatNumberWithSpaces(rawValue);
        updateTotals();  // Обновляем итоги
    });
}

// Добавление новой строки
function addRow() {
    const table = document.getElementById('accountingTable').getElementsByTagName('tbody')[0];
    const rowCount = table.rows.length;
    const row = table.insertRow(rowCount - 1);  // Вставляем перед строкой "Итого"

    for (let i = 0; i < 16; i++) {
        const cell = row.insertCell(i);
        if (i === 15) {
            // Кнопка "Удалить"
            const btn = document.createElement('button');
            btn.textContent = 'Удалить';
            btn.className = 'delete-btn';
            btn.onclick = function() { deleteRow(this); };
            cell.appendChild(btn);
        } else {
            // Все остальные ячейки
            cell.contentEditable = "true";
            bindCellEvents(cell);  // Привязываем обработчики событий к новым ячейкам
        }
    }

    // Обновляем нумерацию строк
    updateRowNumbers();
}

// Удаление строки
function deleteRow(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
    updateRowNumbers();  // Обновление нумерации после удаления
    updateTotals();  // Обновляем итоги после удаления строки
}

// Обновление нумерации строк
function updateRowNumbers() {
    const table = document.getElementById('accountingTable').getElementsByTagName('tbody')[0];
    let index = 1;
    for (let row of table.rows) {
        if (!row.classList.contains('total-row')) {
            row.cells[0].textContent = index++;
        }
    }
}

// Инициализация всех ячеек для вычислений
document.querySelectorAll('#accountingTable tbody td[contenteditable="true"]').forEach(cell => {
    bindCellEvents(cell);
});

// Функция для обновления значений в столбцах 7 (Зарплата) и 11 (Итого начислено)
function calculateColumnValues(row) {
    const workDays = parseFloat(removeSpaces(row.cells[3].textContent)) || 0;  // Рабочие дни
    const workedDays = parseFloat(removeSpaces(row.cells[4].textContent)) || 0;  // Отработанные дни
    const salaryRate = parseFloat(removeSpaces(row.cells[5].textContent)) || 0;  // Оклад

    // Столбец 7: Зарплата
    let salary = 0;
    if (workDays > 0) {
        salary = Math.ceil((salaryRate / workDays) * workedDays);  // Округляем к большему
    }
    row.cells[6].textContent = formatNumberWithSpaces(salary);  // Обновляем зарплату в столбце 7

    // Столбец 8: Больничный лист
    const sickLeave = parseFloat(removeSpaces(row.cells[7].textContent)) || 0;

    // Столбец 9: Отпускные
    const vacationPay = parseFloat(removeSpaces(row.cells[8].textContent)) || 0;

    // Столбец 10: Премии или надбавки
    const bonuses = parseFloat(removeSpaces(row.cells[9].textContent)) || 0;

    // Столбец 11: Итого начислено (суммируем зарплату, больничный, отпускные, премии)
    const totalAccrued = salary + sickLeave + vacationPay + bonuses;
    row.cells[10].textContent = formatNumberWithSpaces(totalAccrued);  // Обновляем итого начислено в столбце 11
}

// Функция для обновления значений в столбцах 12 (НДФЛ), 13 (0.1%) и 15 (Сумма на руки)
function chekColumnValues(row) {
    const totalAccrued = parseFloat(removeSpaces(row.cells[10].textContent)) || 0;  // Столбец 11: Итого начислено
    const ndflRate = parseFloat(document.getElementById('ndflRate').value) || 12;  // Ставка НДФЛ
    const column12Value = totalAccrued * (ndflRate / 100);  // Столбец 12: НДФЛ
    row.cells[11].textContent = formatNumberWithSpaces(column12Value.toFixed(2));  // Округляем до 2 знаков после запятой

    const column13Value = totalAccrued * 0.001;  // Столбец 13: 0.1%
    row.cells[12].textContent = formatNumberWithSpaces(column13Value.toFixed(2));

    const column14Value = parseFloat(removeSpaces(row.cells[13].textContent)) || 0;  // Столбец 14: прочие удержания
    const column15Value = totalAccrued - column12Value - column14Value;  // Столбец 15: Сумма на руки

    // Если результат NaN, заменяем его на 0 и выводим
    if (isNaN(column15Value)) {
        row.cells[14].textContent = '0 сум';
    } else {
        row.cells[14].textContent = formatNumberWithSpaces(column15Value.toFixed(2)) + ' сум';
    }
}


// Обновление всех строк и итогов
function updateAllRows() {
    const table = document.getElementById('accountingTable').getElementsByTagName('tbody')[0];
    for (let row of table.rows) {
        if (!row.classList.contains('total-row') && !row.classList.contains('header-row')) {
            calculateColumnValues(row);  // Рассчитываем столбцы до 11
            chekColumnValues(row);      // Рассчитываем столбец 12
        }
    }
    updateTotals();  // Обновляем итоговые значения
}

// Привязывание событий на редактируемые ячейки
function bindCellEvents(cell) {
    cell.addEventListener('input', function () {
        const rawValue = removeSpaces(this.textContent);
        this.textContent = formatNumberWithSpaces(rawValue);
        updateAllRows();  // Пересчитываем все строки и обновляем итоги
    });
}

// При добавлении новой строки тоже привязываем события
function addRow() {
    const table = document.getElementById('accountingTable').getElementsByTagName('tbody')[0];
    const rowCount = table.rows.length;
    const row = table.insertRow(rowCount - 1);  // Вставляем перед строкой "Итого"

    for (let i = 0; i < 16; i++) {
        const cell = row.insertCell(i);
        if (i === 15) {
            // Кнопка "Удалить"
            const btn = document.createElement('button');
            btn.textContent = 'Удалить';
            btn.className = 'delete-btn';
            btn.onclick = function() { deleteRow(this); };
            cell.appendChild(btn);
        } else {
            // Все остальные ячейки
            cell.contentEditable = "true";
            bindCellEvents(cell);  // Привязываем обработчики событий к новым ячейкам
        }
    }

    // Обновляем нумерацию строк
    updateRowNumbers();
}


// Функция для получения текущей позиции курсора
function getCaretPosition(element) {
    let position = 0;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        position = preCaretRange.toString().length;
    }
    return position;
}

// Функция для установки позиции курсора
function setCaretPosition(element, position) {
    const selection = window.getSelection();
    const range = document.createRange();
    let charIndex = 0, nodeStack = [element], node, foundStart = false;
    while (!foundStart && (node = nodeStack.pop())) {
        if (node.nodeType === 3) {
            const nextCharIndex = charIndex + node.length;
            if (position >= charIndex && position <= nextCharIndex) {
                range.setStart(node, position - charIndex);
                range.setEnd(node, position - charIndex);
                foundStart = true;
            }
            charIndex = nextCharIndex;
        } else {
            let i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }
    selection.removeAllRanges();
    selection.addRange(range);
}

// Привязываем обработчики событий на редактируемые ячейки
function bindCellEvents(cell) {
    cell.addEventListener('input', function () {
        const rawValue = removeSpaces(this.textContent);  // Убираем пробелы

        const cursorPosition = getCaretPosition(this);  // Сохраняем текущее положение курсора до форматирования
        const valueBeforeFormatting = this.textContent.length;  // Длина значения до форматирования

        this.textContent = formatNumberWithSpaces(rawValue);  // Форматируем с пробелами

        const valueAfterFormatting = this.textContent.length;  // Длина значения после форматирования
        const newCursorPosition = cursorPosition + (valueAfterFormatting - valueBeforeFormatting);  // Корректируем позицию курсора

        setCaretPosition(this, newCursorPosition);  // Возвращаем курсор на правильное место

        updateAllRows();  // Пересчитываем все строки и обновляем итоги
    });
}

document.getElementById('ndflRate').addEventListener('input', function() {
    updateAllRows();  // Пересчитываем все строки и обновляем итоги
});

// Функция для установки текущей даты в поле с типом "date"
function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Месяцы идут с 0, поэтому добавляем 1
    const day = String(today.getDate()).padStart(2, '0');  // Делаем так, чтобы день всегда был двухзначным

    const formattedDate = `${year}-${month}-${day}`;
    document.getElementById('datePicker').value = formattedDate;
}

// Устанавливаем сегодняшнюю дату при загрузке страницы
window.onload = function() {
    setTodayDate();
};
