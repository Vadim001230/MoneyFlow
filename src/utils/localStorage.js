// src/utils/localStorage.js

const EXPENSES_KEY = "expense-tracker-expenses";
const CATEGORIES_KEY = "expense-tracker-categories";

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

// Новая функция для удаления расхода
export const deleteExpense = (expenseId) => {
  const expenses = getExpenses();
  const filteredExpenses = expenses.filter(
    (expense) => expense.id !== expenseId
  );
  saveExpenses(filteredExpenses);
};

// Новая функция для обновления расхода
export const updateExpense = (expenseId, updatedExpense) => {
  const expenses = getExpenses();
  const updatedExpenses = expenses.map((expense) =>
    expense.id === expenseId ? { ...expense, ...updatedExpense } : expense
  );
  saveExpenses(updatedExpenses);
};

export const getCategories = () => {
  const defaultCategories = [
    { id: "1", name: "Дети", color: "#FFD700", icon: "👶" },
    { id: "2", name: "Дом, уют", color: "#9B59B6", icon: "🏠" },
    { id: "3", name: "Забота о себе", color: "#F8BBD0", icon: "💅" },
    { id: "4", name: "Здоровье", color: "#E91E63", icon: "💊" },
    { id: "5", name: "Кафе и рестораны", color: "#F44336", icon: "🍽️" },
    { id: "6", name: "Коммуналка", color: "#673AB7", icon: "🏡" },
    { id: "7", name: "Корректировка", color: "#9E9E9E", icon: "❓" },
    { id: "8", name: "Машина", color: "#2196F3", icon: "🚗" },
    { id: "9", name: "Образование", color: "#009688", icon: "📚" },
    { id: "10", name: "Платежи, комиссии", color: "#607D8B", icon: "💳" },
    { id: "11", name: "Подарки", color: "#4CAF50", icon: "🎁" },
    { id: "12", name: "Подписки", color: "#9C27B0", icon: "📱" },
    { id: "13", name: "Покупки", color: "#4CAF50", icon: "🛍️" },
    { id: "14", name: "Продукты", color: "#FF9800", icon: "🛒" },
    { id: "15", name: "Путешествия", color: "#00BCD4", icon: "✈️" },
    { id: "16", name: "Развлечения", color: "#87CEEB", icon: "🎮" },
    { id: "17", name: "Транспорт", color: "#3F51B5", icon: "🚌" },
    { id: "18", name: "Другое", color: "#E0E0E0", icon: "📦" },
  ];

  return defaultCategories;
};

// Утилита для форматирования валюты
export const formatCurrency = (amount) => {
  return `${amount.toLocaleString("ru-RU")} BYN`;
};
