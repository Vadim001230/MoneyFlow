// src/components/AddExpense.jsx
import React, { useState } from 'react';
import { addExpense } from '../utils/localStorage';
import './AddExpense.css';

const AddExpense = ({ categories, onExpenseAdded }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!amount || !category) {
      alert('Заполните сумму и выберите категорию');
      return;
    }

    const expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category,
      description: description || category,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString()
    };

    addExpense(expense);
    onExpenseAdded();
    
    // Очищаем форму
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const selectedCategory = categories.find(cat => cat.name === category);

  return (
    <div className="add-expense">
      <h2>Добавить расход</h2>
      
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group category-group">
          <label htmlFor="category">Категория *</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
            required
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <div className="selected-category-preview">
              <div 
                className="category-preview-circle" 
                style={{ backgroundColor: selectedCategory.color }}
              >
                <span>{selectedCategory.icon}</span>
              </div>
              <span className="category-preview-name">{selectedCategory.name}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Сумма *</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0 BYN"
            min="0"
            step="0.01"
            className="amount-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Необязательно"
            className="description-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Дата *</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          {selectedCategory && (
            <span className="button-category-icon">{selectedCategory.icon}</span>
          )}
          Добавить расход
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
