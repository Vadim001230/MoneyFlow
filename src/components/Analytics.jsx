// src/components/Analytics.jsx
import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { formatCurrency } from "../utils/localStorage";
import "./Analytics.css";

const Analytics = ({ expenses, categories }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat;
      return acc;
    }, {});
  }, [categories]);

  // Функция для фильтрации расходов по периоду
  const getFilteredExpenses = useMemo(() => {
    if (!expenses.length) return [];

    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === "week") {
      // Понедельник текущей недели
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === "month") {
      // Первое число текущего месяца
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      // Последнее число текущего месяца
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // 'all' или default
      return expenses;
    }

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [expenses, selectedPeriod]);

  // Данные для круговой диаграммы по категориям
  const categoryData = useMemo(() => {
    const categoryTotals = {};

    getFilteredExpenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        itemStyle: {
          color: categoriesMap[category]?.color || "#ccc",
        },
      }))
      .sort((a, b) => b.value - a.value);
  }, [getFilteredExpenses, categoriesMap]);

  // Данные для графика по дням
  const dailyData = useMemo(() => {
    if (!getFilteredExpenses.length) return { dates: [], values: [] };

    const now = new Date();
    let startDate, days;

    if (selectedPeriod === "week") {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
      days = 7;
    } else if (selectedPeriod === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      // Количество дней в текущем месяце
      days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    } else {
      // 'all' или default
      if (getFilteredExpenses.length === 0) return { dates: [], values: [] };
      const dates = getFilteredExpenses.map((exp) => new Date(exp.date));
      startDate = new Date(Math.min(...dates));
      const endDate = new Date(Math.max(...dates));
      days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    const dailyTotals = {};

    // Инициализируем все дни нулями
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      dailyTotals[dateKey] = 0;
    }

    // Заполняем данными
    getFilteredExpenses.forEach((expense) => {
      const dateKey = new Date(expense.date).toISOString().split("T")[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + expense.amount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    const values = sortedDates.map((date) => dailyTotals[date]);

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (selectedPeriod === "week") {
        return date.toLocaleDateString("ru-RU", {
          weekday: "short",
          day: "2-digit",
        });
      } else if (selectedPeriod === "month") {
        return date.toLocaleDateString("ru-RU", { day: "2-digit" });
      } else {
        return date.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
        });
      }
    };

    return {
      dates: sortedDates.map(formatDate),
      values,
    };
  }, [getFilteredExpenses, selectedPeriod]);

  // Получаем название периода для отображения
  const getPeriodTitle = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "week":
        return "за эту неделю";
      case "month":
        return `за ${now.toLocaleDateString("ru-RU", {
          month: "long",
          year: "numeric",
        })}`;
      case "all":
        return "за все время";
      default:
        return "";
    }
  };

  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0);

  // Опции для круговой диаграммы с адаптацией под мобильные
  const pieOption = {
    title: {
      text: `Расходы по категориям ${getPeriodTitle()}`,
      left: "center",
      textStyle: {
        fontSize: isMobile ? 14 : 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const percent = params.percent;
        const value = params.value;
        return `${params.seriesName}<br/>${params.name}: ${formatCurrency(
          value
        )} (${percent}%)`;
      },
    },
    legend: {
      orient: isMobile ? "horizontal" : "vertical",
      left: isMobile ? "center" : undefined,
      right: isMobile ? undefined : 10,
      top: isMobile ? undefined : 20,
      bottom: isMobile ? 20 : 20,
      itemGap: isMobile ? 15 : 10,
      formatter: (name) => {
        const item = categoryData.find((d) => d.name === name);
        if (!item || totalAmount === 0) return name;
        const percent = ((item.value / totalAmount) * 100).toFixed(1);

        return `${name}\n${formatCurrency(item.value)} (${percent}%)`;
      },
      textStyle: {
        fontSize: isMobile ? 10 : 11,
        lineHeight: isMobile ? 12 : 14,
      },
    },
    series: [
      {
        name: "Расходы",
        type: "pie",
        radius: isMobile ? ["30%", "60%"] : ["40%", "70%"],
        center: isMobile ? ["50%", "40%"] : ["40%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
          formatter: (params) => {
            const percent = params.percent;

            if (isMobile) {
              return `${percent}%\n${params.name}`;
            } else {
              const value = params.value;
              return `${percent}%\n${params.name}\n${formatCurrency(value)}`;
            }
          },
          fontSize: isMobile ? 8 : 10,
          fontWeight: "bold",
          lineHeight: isMobile ? 10 : 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: isMobile ? 10 : 14, // Контролируем размер шрифта при ховере
            fontWeight: "bold",
            formatter: (params) => {
              const percent = params.percent;

              if (isMobile) {
                // На мобильных при ховере показываем процент и название категории
                return `${percent}%\n${params.name}`;
              } else {
                // На десктопе при ховере показываем процент и сумму
                const value = params.value;
                return `${percent}%\n${formatCurrency(value)}`;
              }
            },
          },
          // Можно также управлять увеличением сектора при ховере
          scaleSize: isMobile ? 5 : 10,
        },
        labelLine: {
          show: true,
          length: isMobile ? 10 : 20,
          length2: isMobile ? 5 : 15,
        },
        data: categoryData,
      },
    ],
  };

  // Опции для линейного графика
  const lineOption = {
    title: {
      text: `Расходы ${getPeriodTitle()}`,
      textStyle: {
        fontSize: isMobile ? 14 : 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const value = params[0].value;
        return `${params[0].axisValue}: ${formatCurrency(value)}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dailyData.dates,
      axisLabel: {
        rotate: selectedPeriod === "all" ? 45 : 0,
        fontSize: isMobile ? 8 : 10,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `${value} BYN`,
        fontSize: isMobile ? 8 : 10,
      },
    },
    series: [
      {
        name: "Расходы",
        type: "line",
        stack: "Total",
        smooth: true,
        areaStyle: {
          opacity: 0.3,
        },
        itemStyle: {
          color: "#4ECDC4",
        },
        data: dailyData.values,
      },
    ],
  };

  const filteredTotalAmount = useMemo(() => {
    return getFilteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
  }, [getFilteredExpenses]);

  const averageDaily = useMemo(() => {
    if (getFilteredExpenses.length === 0) return 0;
    const uniqueDays = new Set(
      getFilteredExpenses.map((exp) => new Date(exp.date).toDateString())
    ).size;
    return filteredTotalAmount / Math.max(uniqueDays, 1);
  }, [getFilteredExpenses, filteredTotalAmount]);

  if (expenses.length === 0) {
    return (
      <div className="analytics-empty">
        <div className="empty-state">
          <span className="empty-emoji">📈</span>
          <h3>Нет данных для аналитики</h3>
          <p>Добавьте несколько расходов для просмотра статистики</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>Аналитика расходов</h2>

        <div className="period-selector">
          <button
            className={`period-btn ${
              selectedPeriod === "week" ? "active" : ""
            }`}
            onClick={() => setSelectedPeriod("week")}
          >
            Неделя
          </button>
          <button
            className={`period-btn ${
              selectedPeriod === "month" ? "active" : ""
            }`}
            onClick={() => setSelectedPeriod("month")}
          >
            Месяц
          </button>
          <button
            className={`period-btn ${selectedPeriod === "all" ? "active" : ""}`}
            onClick={() => setSelectedPeriod("all")}
          >
            Все время
          </button>
        </div>
      </div>

      {getFilteredExpenses.length === 0 ? (
        <div className="no-data-period">
          <span className="empty-emoji">📊</span>
          <h3>Нет расходов {getPeriodTitle()}</h3>
          <p>Выберите другой период или добавьте расходы</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">
                {formatCurrency(filteredTotalAmount)}
              </div>
              <div className="stat-label">Общие расходы {getPeriodTitle()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {formatCurrency(Math.round(averageDaily))}
              </div>
              <div className="stat-label">Средние в день</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{categoryData.length}</div>
              <div className="stat-label">Активных категорий</div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-section">
              <ReactECharts
                option={pieOption}
                style={{ height: isMobile ? "550px" : "500px", width: "100%" }}
                opts={{ renderer: "svg" }}
              />
            </div>

            <div className="chart-section">
              <ReactECharts
                option={lineOption}
                style={{ height: "400px", width: "100%" }}
                opts={{ renderer: "svg" }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
