// src/utils/sessionStorage.js

const ACTIVE_TAB_KEY = "expense-tracker-active-tab";
const EXPENSES_PERIOD_KEY = "expense-tracker-expenses-period";

export const getActiveTab = () => {
  return sessionStorage.getItem(ACTIVE_TAB_KEY) || "expenses";
};

export const setActiveTab = (tab) => {
  sessionStorage.setItem(ACTIVE_TAB_KEY, tab);
};

// Новые функции для периода расходов
export const getExpensesPeriod = () => {
  const saved = sessionStorage.getItem(EXPENSES_PERIOD_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  // По умолчанию - текущий месяц
  const now = new Date();
  return {
    type: "month",
    year: now.getFullYear(),
    month: now.getMonth(),
  };
};

export const setExpensesPeriod = (period) => {
  sessionStorage.setItem(EXPENSES_PERIOD_KEY, JSON.stringify(period));
};
