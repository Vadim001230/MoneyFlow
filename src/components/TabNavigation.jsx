// src/components/TabNavigation.jsx
import React from 'react';
import { List, BarChart3, Plus } from 'lucide-react';
import './TabNavigation.css';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="tab-navigation">
      <button
        className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
        onClick={() => setActiveTab('expenses')}
      >
        <List size={20} />
        Расходы
      </button>
      
      <button
        className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('analytics')}
      >
        <BarChart3 size={20} />
        Аналитика
      </button>
      
      <button
        className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
        onClick={() => setActiveTab('add')}
      >
        <Plus size={20} />
        Добавить
      </button>
    </nav>
  );
};

export default TabNavigation;
