// src/components/Analytics.jsx
import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { formatCurrency } from "../utils/localStorage";
import {
  getAnalyticsPeriod,
  setAnalyticsPeriod,
} from "../utils/sessionStorage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Analytics.css";

const Analytics = ({ expenses, categories }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Загружаем сохраненный период
  const savedPeriod = getAnalyticsPeriod();
  const [selectedPeriod, setSelectedPeriod] = useState(savedPeriod.type);
  const [selectedDate, setSelectedDate] = useState(new Date(savedPeriod.date));

  // Сохраняем период при изменении
  useEffect(() => {
    setAnalyticsPeriod({
      type: selectedPeriod,
      date: selectedDate.toISOString(),
    });
  }, [selectedPeriod, selectedDate]);

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

  // Функция для получения списка доступных месяцев
  const availableMonths = useMemo(() => {
    if (!expenses.length) return [];

    const months = expenses.map((exp) => {
      const date = new Date(exp.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    });

    const uniqueMonths = [...new Set(months)].sort().reverse();

    return uniqueMonths.map((monthStr) => {
      const [year, month] = monthStr.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    });
  }, [expenses]);

  // Функция для перехода к предыдущему месяцу
  const goToPreviousMonth = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Функция для перехода к следующему месяцу
  const goToNextMonth = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Проверка, можно ли перейти к следующему месяцу - ИСПРАВЛЕНО
  const canGoNext = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    // Если год выбранного периода меньше текущего - можно идти вперед
    if (selectedYear < currentYear) return true;

    // Если год тот же, проверяем месяц
    if (selectedYear === currentYear && selectedMonth < currentMonth)
      return true;

    // Иначе нельзя
    return false;
  }, [selectedDate]);

  // Функция для фильтрации расходов по периоду
  const getFilteredExpenses = useMemo(() => {
    if (!expenses.length) return [];

    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === "week") {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === "month") {
      startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      startDate.setHours(0, 0, 0, 0);

      const isCurrentMonth =
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth();

      if (isCurrentMonth) {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      return expenses;
    }

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [expenses, selectedPeriod, selectedDate]);

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
      startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );

      const isCurrentMonth =
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth();

      if (isCurrentMonth) {
        days = now.getDate();
      } else {
        days = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        ).getDate();
      }
    } else {
      if (getFilteredExpenses.length === 0) return { dates: [], values: [] };
      const dates = getFilteredExpenses.map((exp) => new Date(exp.date));
      startDate = new Date(Math.min(...dates));
      const endDate = new Date(Math.max(...dates));
      days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    const dailyTotals = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      dailyTotals[dateKey] = 0;
    }

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
  }, [getFilteredExpenses, selectedPeriod, selectedDate]);

  // Данные для столбчатого графика по месяцам
  const monthlyData = useMemo(() => {
    if (!expenses.length) return { months: [], values: [], rawMonths: [] };

    const monthlyTotals = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
    });

    const sortedMonths = Object.keys(monthlyTotals).sort();
    const lastMonths = sortedMonths.slice(-12);

    const formatMonth = (monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("ru-RU", {
        month: "short",
        year: isMobile ? undefined : "numeric",
      });
    };

    return {
      months: lastMonths.map(formatMonth),
      values: lastMonths.map((month) => monthlyTotals[month]),
      rawMonths: lastMonths,
    };
  }, [expenses, isMobile]);

  // Получаем название периода для отображения
  const getPeriodTitle = () => {
    if (selectedPeriod === "week") {
      return "за эту неделю";
    } else if (selectedPeriod === "month") {
      const monthStr = selectedDate.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      });
      return `за ${monthStr}`;
    } else {
      return "за все время";
    }
  };

  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0);

  // Опции для круговой диаграммы
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
      bottom: 20,
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
        radius: isMobile ? ["25%", "60%"] : ["40%", "70%"],
        center: isMobile ? ["50%", "27%"] : ["40%", "50%"],
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
            fontSize: isMobile ? 10 : 14,
            fontWeight: "bold",
            formatter: (params) => {
              const percent = params.percent;
              if (isMobile) {
                return `${percent}%\n${params.name}`;
              } else {
                const value = params.value;
                return `${percent}%\n${params.name}\n${formatCurrency(value)}`;
              }
            },
          },
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

  // Опции для столбчатого графика по месяцам
  const barOption = {
    title: {
      text: "Динамика расходов по месяцам",
      textStyle: {
        fontSize: isMobile ? 14 : 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params) => {
        const value = params[0].value;
        const monthIndex = params[0].dataIndex;
        const monthKey = monthlyData.rawMonths[monthIndex];
        const [year, month] = monthKey.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleDateString("ru-RU", {
          month: "long",
          year: "numeric",
        });
        return `${monthName}: ${formatCurrency(value)}`;
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
      data: monthlyData.months,
      axisLabel: {
        rotate: isMobile ? 45 : 0,
        fontSize: isMobile ? 9 : 10,
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
        type: "bar",
        data: monthlyData.values,
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "#4ECDC4",
              },
              {
                offset: 1,
                color: "#45b7aa",
              },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: "#3da89f",
          },
        },
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

    const now = new Date();
    let totalDays;

    if (selectedPeriod === "week") {
      // Для недели - 7 дней или меньше если неделя еще идет
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));

      const daysPassed =
        Math.ceil((now - weekStart) / (1000 * 60 * 60 * 24)) + 1;
      totalDays = Math.min(daysPassed, 7);
    } else if (selectedPeriod === "month") {
      const isCurrentMonth =
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth();

      if (isCurrentMonth) {
        // Для текущего месяца - количество прошедших дней (включая сегодня)
        totalDays = now.getDate();
      } else {
        // Для прошлых месяцев - все дни месяца
        totalDays = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        ).getDate();
      }
    } else {
      // Для "все время" - количество дней от первого до последнего расхода
      if (expenses.length === 0) return 0;
      const dates = expenses.map((exp) => new Date(exp.date));
      const firstDate = new Date(Math.min(...dates));
      const lastDate = new Date(Math.max(...dates));
      totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    return filteredTotalAmount / Math.max(totalDays, 1);
  }, [
    getFilteredExpenses,
    filteredTotalAmount,
    selectedPeriod,
    selectedDate,
    expenses,
  ]);

  const maxDailyExpense = useMemo(() => {
    if (dailyData.values.length === 0) return 0;
    return Math.max(...dailyData.values);
  }, [dailyData.values]);

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
            onClick={() => {
              setSelectedPeriod("week");
              setSelectedDate(new Date());
            }}
          >
            Неделя
          </button>
          <button
            className={`period-btn ${
              selectedPeriod === "month" ? "active" : ""
            }`}
            onClick={() => {
              setSelectedPeriod("month");
              setSelectedDate(new Date());
            }}
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

        {selectedPeriod === "month" && (
          <div className="month-navigator">
            <button
              className="nav-btn"
              onClick={goToPreviousMonth}
              disabled={availableMonths.length === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="current-month">
              {selectedDate.toLocaleDateString("ru-RU", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              className="nav-btn"
              onClick={goToNextMonth}
              disabled={!canGoNext}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
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
              <div className="stat-value">
                {formatCurrency(maxDailyExpense)}
              </div>
              <div className="stat-label">Максимум в день</div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-section">
              <ReactECharts
                option={pieOption}
                style={{ height: isMobile ? "700px" : "500px", width: "100%" }}
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

            {monthlyData.months.length > 0 && (
              <div className="chart-section">
                <ReactECharts
                  option={barOption}
                  style={{ height: "400px", width: "100%" }}
                  opts={{ renderer: "svg" }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
