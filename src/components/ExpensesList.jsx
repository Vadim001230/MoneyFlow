// src/components/ExpensesList.jsx
import React, { useMemo, useState } from "react";
import {
  deleteExpense,
  updateExpense,
  formatCurrency,
} from "../utils/localStorage";
import { Edit, Trash2, Check, X } from "lucide-react";
import "./ExpensesList.css";

const ExpensesList = ({ expenses, categories, onExpensesChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat;
      return acc;
    }, {});
  }, [categories]);

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

    expenses.forEach((expense) => {
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
  }, [expenses]);

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
            {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
          </strong>
        </div>
      </div>

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
    </div>
  );
};

export default ExpensesList;
