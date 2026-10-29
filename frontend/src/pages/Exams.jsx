/**
 * Upgraded Exams Page
 * Compact cards + Eligibility + Enhanced Pie Chart with animations
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import "../styles/Pages.css";

/* ── Professional color palette ────────────────────── */
const CATEGORY_COLORS = {
  Engineering: "#1e3a5f",   // Deep Navy
  Medical:    "#1a7a6d",    // Teal
  Government: "#4a6274",    // Steel Blue
  Management: "#2d6e4f",    // Soft Emerald
  Defence:    "#b0703c",    // Muted Copper
};

const COLORS_ARRAY = Object.values(CATEGORY_COLORS);

/* ── Custom active shape (hover / click expand) ───── */
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value, percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.18))",
          transition: "all 0.3s ease-out",
        }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" className="pie-center-count">
        {value}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="pie-center-label">
        {payload.name}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" className="pie-center-pct">
        {(percent * 100).toFixed(0)}%
      </text>
    </g>
  );
};

/* ── Custom tooltip ────────────────────────────────── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const color = CATEGORY_COLORS[name] || COLORS_ARRAY[0];
  return (
    <div className="pie-tooltip">
      <span className="pie-tooltip-dot" style={{ background: color }} />
      <span className="pie-tooltip-name">{name}</span>
      <span className="pie-tooltip-value">{value} exams</span>
    </div>
  );
};

/* ── Custom legend ─────────────────────────────────── */
const CustomLegend = ({ pieData, totalExams, activeIndex, onHover }) => (
  <div className="pie-legend">
    {pieData.map((entry, i) => {
      const color = CATEGORY_COLORS[entry.name] || COLORS_ARRAY[i];
      const pct = totalExams ? ((entry.value / totalExams) * 100).toFixed(0) : 0;
      const isActive = activeIndex === i;
      return (
        <div
          key={entry.name}
          className={`pie-legend-item${isActive ? " pie-legend-item--active" : ""}`}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
        >
          <span className="pie-legend-dot" style={{ background: color }} />
          <span className="pie-legend-name">{entry.name}</span>
          <span className="pie-legend-pct">{pct}%</span>
          <span className="pie-legend-count">{entry.value}</span>
        </div>
      );
    })}
  </div>
);

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  const onPieHover = useCallback((index) => setActiveIndex(index), []);

  useEffect(() => {
    fetch("http://localhost:5000/api/exams")
      .then(res => res.json())
      .then(data => {
        setExams(data.exams || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch exams:", err);
        setLoading(false);
      });
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatus = (deadline) => {
    const today = new Date();
    const d = new Date(deadline);
    if (d < today) return "Closed";
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diff <= 7) return "Urgent";
    return "Open";
  };

  // Pie chart data
  const pieData = Object.values(
    exams.reduce((acc, exam) => {
      acc[exam.type] = acc[exam.type] || { name: exam.type, value: 0 };
      acc[exam.type].value += 1;
      return acc;
    }, {})
  );

  return (
    <div className="page-container">
      <div className="exams-header">
        <h2 className="page-title">📝 Competitive & Entrance Exams</h2>
        <div className="exam-counter">
          <span className="counter-label">Total Exams:</span>
          <span className="counter-value">{exams.length}</span>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="chart-wrapper pie-chart-enhanced">
        <h3 className="chart-title">Exam Distribution by Category</h3>
        <div className="pie-chart-layout">
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={110}
                  paddingAngle={2}
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={2}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={CATEGORY_COLORS[entry.name] || COLORS_ARRAY[index % COLORS_ARRAY.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center overlay (visible when no slice is active) */}
            {activeIndex === null && (
              <div className="pie-center-overlay">
                <span className="pie-center-overlay-count">{exams.length}</span>
                <span className="pie-center-overlay-label">Total Exams</span>
              </div>
            )}
          </div>
          <CustomLegend
            pieData={pieData}
            totalExams={exams.length}
            activeIndex={activeIndex}
            onHover={onPieHover}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading exams...</p>
      ) : (
        <div className="exams-grid">
          {exams.map((exam, index) => (
            <div key={exam.id} className="exam-card-small" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="card-accent"></div>
              <div className="exam-header">
                <span className="exam-type">{exam.type}</span>
                <span className={`status status-${getStatus(exam.deadline)}`}>
                  {getStatus(exam.deadline)}
                </span>
              </div>

              <h4 className="exam-name">{exam.name}</h4>
              <p className="exam-desc">{exam.description}</p>

              <div className="exam-info">
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <span className="info-text">{formatDate(exam.date)}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">⏳</span>
                  <span className="info-text">{formatDate(exam.deadline)}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">🎓</span>
                  <span className="info-text">{exam.eligibility}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">🎯</span>
                  <span className="info-text">Max Score: {exam.score}</span>
                </div>
              </div>

              {getStatus(exam.deadline) === "Closed" ? (
                <button className="btn-apply disabled" disabled>
                  Applications Closed
                </button>
              ) : (
                <a
                  href={exam.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-apply"
                >
                  Apply Now
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
