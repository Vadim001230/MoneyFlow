// src/utils/sessionStorage.js

const ACTIVE_TAB_KEY = "expense-tracker-active-tab";
const EXPENSES_PERIOD_KEY = "expense-tracker-expenses-period";
const ANALYTICS_PERIOD_KEY = "expense-tracker-analytics-period";

export const getActiveTab = () => {
  return sessionStorage.getItem(ACTIVE_TAB_KEY) || "expenses";
};

export const setActiveTab = (tab) => {
  sessionStorage.setItem(ACTIVE_TAB_KEY, tab);
};

// Функции для периода расходов
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

// Функции для периода аналитики
export const getAnalyticsPeriod = () => {
  const saved = sessionStorage.getItem(ANALYTICS_PERIOD_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  // По умолчанию - месяц и текущая дата
  return {
    type: "month",
    date: new Date().toISOString(),
  };
};

export const setAnalyticsPeriod = (period) => {
  sessionStorage.setItem(ANALYTICS_PERIOD_KEY, JSON.stringify(period));
};
