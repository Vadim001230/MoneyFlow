// src/App.jsx
import React, { useState, useEffect } from 'react';
import { getExpenses, getCategories } from './utils/localStorage';
import ExpensesList from './components/ExpensesList';
import Analytics from './components/Analytics';
import AddExpense from './components/AddExpense';
import DataManager from './components/DataManager';
import TabNavigation from './components/TabNavigation';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setExpenses(getExpenses());
    setCategories(getCategories());
  }, []);

  const refreshData = () => {
    setExpenses(getExpenses());
    setCategories(getCategories());
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Мой Бюджет</h1>
      </header>
      
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      <main className="app-main">
        {activeTab === 'expenses' && (
          <ExpensesList 
            expenses={expenses} 
            categories={categories}
            onExpensesChange={refreshData}
          />
        )}
        
        {activeTab === 'analytics' && (
          <Analytics expenses={expenses} categories={categories} />
        )}
        
        {activeTab === 'add' && (
          <AddExpense 
            categories={categories} 
            onExpenseAdded={refreshData} 
          />
        )}
        
        {activeTab === 'data' && (
          <DataManager onDataChange={refreshData} />
        )}
      </main>
    </div>
  );
};

export default App;
