// src/components/ExpensesList.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  deleteExpense,
  updateExpense,
  formatCurrency,
} from "../utils/localStorage";
import { getExpensesPeriod, setExpensesPeriod } from "../utils/sessionStorage";
import {
  Edit,
  Trash2,
  Check,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import "./ExpensesList.css";

const ExpensesList = ({ expenses, categories, onExpensesChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [period, setPeriod] = useState(getExpensesPeriod());

  // Сохраняем период при изменении
  useEffect(() => {
    setExpensesPeriod(period);
  }, [period]);

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat;
      return acc;
    }, {});
  }, [categories]);

  // Получаем список доступных месяцев из расходов
  const availableMonths = useMemo(() => {
    if (!expenses.length) return [];

    const monthsSet = new Set();
    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      monthsSet.add(`${date.getFullYear()}-${date.getMonth()}`);
    });

    const months = Array.from(monthsSet)
      .map((key) => {
        const [year, month] = key.split("-");
        return { year: parseInt(year), month: parseInt(month) };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    return months;
  }, [expenses]);

  // Функции навигации по месяцам
  const goToPreviousMonth = () => {
    setPeriod((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { type: "month", year: prev.year - 1, month: 11 };
      }
      return { type: "month", year: prev.year, month: newMonth };
    });
  };

  const goToNextMonth = () => {
    setPeriod((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { type: "month", year: prev.year + 1, month: 0 };
      }
      return { type: "month", year: prev.year, month: newMonth };
    });
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setPeriod({
      type: "month",
      year: now.getFullYear(),
      month: now.getMonth(),
    });
  };

  const showAllPeriod = () => {
    setPeriod({ type: "all" });
  };

  // Проверка, можно ли идти вперед
  const canGoNext = useMemo(() => {
    if (period.type === "all") return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Если год выбранного периода меньше текущего - можно идти вперед
    if (period.year < currentYear) return true;

    // Если год тот же, проверяем месяц
    if (period.year === currentYear && period.month < currentMonth) return true;

    // Иначе нельзя
    return false;
  }, [period]);

  // Фильтруем расходы по периоду
  const periodFilteredExpenses = useMemo(() => {
    if (period.type === "all") {
      return expenses;
    }

    return expenses.filter((expense) => {
      const date = new Date(expense.date);
      return (
        date.getFullYear() === period.year && date.getMonth() === period.month
      );
    });
  }, [expenses, period]);

  // Обработчик переключения категории в фильтре
  const toggleCategory = (categoryName) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((cat) => cat !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  // Выбрать все категории
  const selectAllCategories = () => {
    setSelectedCategories(categories.map((cat) => cat.name));
  };

  // Сбросить фильтр
  const clearFilter = () => {
    setSelectedCategories([]);
  };

  // Фильтруем расходы по выбранным категориям
  const filteredExpenses = useMemo(() => {
    if (selectedCategories.length === 0) {
      return periodFilteredExpenses;
    }
    return periodFilteredExpenses.filter((expense) =>
      selectedCategories.includes(expense.category)
    );
  }, [periodFilteredExpenses, selectedCategories]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Сегодня";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Вчера";
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupedExpenses = useMemo(() => {
    const groups = {};

    filteredExpenses.forEach((expense) => {
      const dateKey = new Date(expense.date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => ({
        date: dateKey,
        expenses: groups[dateKey].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        total: groups[dateKey].reduce((sum, exp) => sum + exp.amount, 0),
      }));
  }, [filteredExpenses]);

  const handleDelete = (expenseId) => {
    if (window.confirm("Вы уверены, что хотите удалить этот расход?")) {
      deleteExpense(expenseId);
      onExpensesChange();
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: new Date(expense.date).toISOString().split("T")[0],
    });
  };

  const handleSaveEdit = (expenseId) => {
    if (!editForm.amount || !editForm.category) {
      alert("Заполните сумму и выберите категорию");
      return;
    }

    const updatedExpense = {
      amount: parseFloat(editForm.amount),
      category: editForm.category,
      description: editForm.description || editForm.category,
      date: new Date(editForm.date).toISOString(),
    };

    updateExpense(expenseId, updatedExpense);
    setEditingId(null);
    setEditForm({});
    onExpensesChange();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Форматирование периода для отображения
  const getPeriodTitle = () => {
    if (period.type === "all") {
      return "за все время";
    }
    const date = new Date(period.year, period.month);
    return date.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="expenses-empty">
        <div className="empty-state">
          <span className="empty-emoji">📊</span>
          <h3>Пока нет расходов</h3>
          <p>Добавьте первый расход во вкладке "Добавить"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expenses-list">
      <div className="expenses-summary">
        <h2>История расходов</h2>
        <div className="total-amount">
          Всего:{" "}
          <strong>
            {formatCurrency(
              filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            )}
          </strong>
        </div>
      </div>

      {/* Селектор периода */}
      <div className="period-selector-section">
        <div className="period-controls">
          <button
            className={`period-type-btn ${
              period.type === "month" ? "active" : ""
            }`}
            onClick={goToCurrentMonth}
          >
            <Calendar size={16} />
            Месяц
          </button>
          <button
            className={`period-type-btn ${
              period.type === "all" ? "active" : ""
            }`}
            onClick={showAllPeriod}
          >
            Все время
          </button>
        </div>

        {period.type === "month" && (
          <div className="month-navigator">
            <button
              className="nav-month-btn"
              onClick={goToPreviousMonth}
              disabled={availableMonths.length === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="current-period">{getPeriodTitle()}</div>
            <button
              className="nav-month-btn"
              onClick={goToNextMonth}
              disabled={!canGoNext}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {period.type === "all" && (
          <div className="all-period-label">Показаны все расходы</div>
        )}
      </div>

      {/* Фильтр по категориям */}
      <div className="filter-section">
        <button
          className={`filter-toggle ${showFilter ? "active" : ""}`}
          onClick={() => setShowFilter(!showFilter)}
        >
          <Filter size={16} />
          Фильтр по категориям
          {selectedCategories.length > 0 && (
            <span className="filter-badge">{selectedCategories.length}</span>
          )}
        </button>

        {showFilter && (
          <div className="filter-panel">
            <div className="filter-actions">
              <button
                className="filter-action-btn"
                onClick={selectAllCategories}
              >
                Выбрать все
              </button>
              <button className="filter-action-btn" onClick={clearFilter}>
                Сбросить
              </button>
            </div>

            <div className="category-filters">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="category-filter-item"
                  style={{
                    borderColor: selectedCategories.includes(category.name)
                      ? category.color
                      : "#e1e8ed",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                  />
                  <span
                    className="category-filter-icon"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </span>
                  <span className="category-filter-name">{category.name}</span>
                  <span className="category-filter-count">
                    (
                    {
                      periodFilteredExpenses.filter(
                        (exp) => exp.category === category.name
                      ).length
                    }
                    )
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="no-results">
          <span className="empty-emoji">🔍</span>
          <h3>Нет расходов {getPeriodTitle()}</h3>
          <p>
            {selectedCategories.length > 0
              ? "Попробуйте выбрать другие категории"
              : "В этом периоде нет расходов"}
          </p>
        </div>
      ) : (
        <>
          {groupedExpenses.map((group) => (
            <div key={group.date} className="expense-day-group">
              <div className="day-header">
                <h3>{formatDate(group.date)}</h3>
                <span className="day-total">{formatCurrency(group.total)}</span>
              </div>

              <div className="expenses-day-list">
                {group.expenses.map((expense) => {
                  const category = categoriesMap[expense.category];
                  const isEditing = editingId === expense.id;

                  return (
                    <div
                      key={expense.id}
                      className={`expense-item ${isEditing ? "editing" : ""}`}
                    >
                      <div
                        className="expense-category"
                        style={{ backgroundColor: category?.color || "#ccc" }}
                      >
                        <span className="category-icon">
                          {category?.icon || "📦"}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="expense-edit-form">
                          <div className="edit-row">
                            <select
                              value={editForm.category}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  category: e.target.value,
                                }))
                              }
                              className="edit-select"
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              className="edit-amount"
                              placeholder="Сумма"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="edit-row">
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="edit-description"
                              placeholder="Описание"
                            />
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                              className="edit-date"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="expense-details">
                          <div className="expense-category-main">
                            {expense.category}
                          </div>
                          {expense.description !== expense.category && (
                            <div className="expense-description">
                              {expense.description}
                            </div>
                          )}
                          <div className="expense-time">
                            {formatTime(expense.createdAt)}
                          </div>
                        </div>
                      )}

                      <div className="expense-actions">
                        {isEditing ? (
                          <>
                            <button
                              className="action-btn save-btn"
                              onClick={() => handleSaveEdit(expense.id)}
                              title="Сохранить"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="action-btn cancel-btn"
                              onClick={handleCancelEdit}
                              title="Отменить"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="expense-amount">
                              -{formatCurrency(expense.amount)}
                            </div>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(expense)}
                                title="Редактировать"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDelete(expense.id)}
                                title="Удалить"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default ExpensesList;
