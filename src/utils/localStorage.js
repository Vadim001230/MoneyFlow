// src/utils/localStorage.js

const EXPENSES_KEY = "expense-tracker-expenses";

export const getExpenses = () => {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading expenses:", error);
    return [];
  }
};

export const saveExpenses = (expenses) => {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error("Error saving expenses:", error);
  }
};

export const addExpense = (expense) => {
  const expenses = getExpenses();
  expenses.unshift(expense);
  saveExpenses(expenses);
};

export const deleteExpense = (expenseId) => {
  const expenses = getExpenses();
  const filteredExpenses = expenses.filter(
    (expense) => expense.id !== expenseId
  );
  saveExpenses(filteredExpenses);
};

export const updateExpense = (expenseId, updatedExpense) => {
  const expenses = getExpenses();
  const updatedExpenses = expenses.map((expense) =>
    expense.id === expenseId ? { ...expense, ...updatedExpense } : expense
  );
  saveExpenses(updatedExpenses);
};

export const getCategories = () => [
  { id: "1", name: "Дети", color: "#FFD700", icon: "👶" },
  { id: "2", name: "Дом, уют", color: "#9B59B6", icon: "🏠" },
  { id: "3", name: "Забота о себе", color: "#F8BBD0", icon: "💅" },
  { id: "4", name: "Здоровье", color: "#E91E63", icon: "💊" },
  { id: "5", name: "Зубы", color: "#FF6B9D", icon: "🦷" },
  { id: "6", name: "Кафе и рестораны", color: "#F44336", icon: "🍽️" },
  { id: "7", name: "Коммуналка", color: "#673AB7", icon: "🏡" },
  { id: "8", name: "Корректировка", color: "#9E9E9E", icon: "❓" },
  { id: "9", name: "Машина", color: "#2196F3", icon: "🚗" },
  { id: "10", name: "Образование", color: "#009688", icon: "📚" },
  { id: "11", name: "Платежи, комиссии", color: "#607D8B", icon: "💳" },
  { id: "12", name: "Подарки", color: "#4CAF50", icon: "🎁" },
  { id: "13", name: "Подписки", color: "#9C27B0", icon: "📱" },
  { id: "14", name: "Покупки", color: "#4CAF50", icon: "🛍️" },
  { id: "15", name: "Продукты", color: "#FF9800", icon: "🛒" },
  { id: "16", name: "Путешествия", color: "#00BCD4", icon: "✈️" },
  { id: "17", name: "Развлечения", color: "#87CEEB", icon: "🎮" },
  { id: "18", name: "Транспорт", color: "#3F51B5", icon: "🚌" },
  { id: "19", name: "Другое", color: "#E0E0E0", icon: "📦" },
];


// Утилита для форматирования валюты
export const formatCurrency = (amount) => {
  return `${amount.toLocaleString("ru-RU")} BYN`;
};

// Новые функции для экспорта и импорта
export const exportData = () => {
  try {
    const expenses = getExpenses();
    const categories = getCategories();

    const exportData = {
      expenses,
      categories,
      exportDate: new Date().toISOString(),
      version: "1.0",
      appName: "Expense Tracker",
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `expense-tracker-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    return true;
  } catch (error) {
    console.error("Error exporting data:", error);
    return false;
  }
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);

          // Валидация структуры данных
          if (!importedData.expenses || !importedData.categories) {
            throw new Error("Неверная структура файла");
          }

          // Проверяем что это наш формат
          if (importedData.appName !== "Expense Tracker") {
            throw new Error("Файл не от приложения Expense Tracker");
          }

          // Валидация данных расходов
          const validExpenses = importedData.expenses.filter(
            (expense) =>
              expense.id &&
              typeof expense.amount === "number" &&
              expense.category &&
              expense.date
          );

          // Валидация категорий
          const validCategories = importedData.categories.filter(
            (category) =>
              category.id && category.name && category.color && category.icon
          );

          if (validExpenses.length === 0 && validCategories.length === 0) {
            throw new Error("Файл не содержит валидных данных");
          }

          resolve({
            expenses: validExpenses,
            categories: validCategories,
            importDate: importedData.exportDate,
          });
        } catch (parseError) {
          reject(new Error("Ошибка чтения файла: " + parseError.message));
        }
      };

      reader.onerror = () => {
        reject(new Error("Ошибка чтения файла"));
      };

      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

export const mergeImportedData = (importedData, mergeMode = "merge") => {
  try {
    if (mergeMode === "replace") {
      // Заменяем все данные
      saveExpenses(importedData.expenses);
    } else {
      // Объединяем данные
      const currentExpenses = getExpenses();

      // Объединяем расходы (избегаем дубликатов по ID)
      const existingExpenseIds = new Set(currentExpenses.map((exp) => exp.id));
      const newExpenses = importedData.expenses.filter(
        (exp) => !existingExpenseIds.has(exp.id)
      );
      const mergedExpenses = [...currentExpenses, ...newExpenses];

      saveExpenses(mergedExpenses);
    }

    return true;
  } catch (error) {
    console.error("Error merging imported data:", error);
    return false;
  }
};
