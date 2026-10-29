/**
 * Scholarships Page
 * Scholarship opportunities with enhanced pie chart matching Exams page design
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  MAHADBT:       "#1e3a5f",   // Deep Navy
  NSP:           "#1a7a6d",   // Teal
  PRIVATE:       "#4a6274",   // Steel Blue
  NGO:           "#b0703c",   // Muted Copper
  INTERNATIONAL: "#6c8ebf",   // Slate Blue
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
      <span className="pie-tooltip-value">{value} scholarships</span>
    </div>
  );
};

/* ── Custom legend ─────────────────────────────────── */
const CustomLegend = ({ pieData, totalItems, activeIndex, onHover }) => (
  <div className="pie-legend">
    {pieData.map((entry, i) => {
      const color = CATEGORY_COLORS[entry.name] || COLORS_ARRAY[i];
      const pct = totalItems ? ((entry.value / totalItems) * 100).toFixed(0) : 0;
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

const Scholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  const onPieHover = useCallback((index) => setActiveIndex(index), []);

  useEffect(() => {
    fetch("http://localhost:5000/api/scholarships")
      .then(res => res.json())
      .then(data => {
        setScholarships(data.scholarships || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch scholarships:", err);
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
    if (diff <= 7) return "Hurry";
    return "Open";
  };

  // Pie chart data - Distribution by portal type
  const pieData = useMemo(() => {
    return Object.values(
      scholarships.reduce((acc, item) => {
        const key = item.portalType || "PRIVATE";
        acc[key] = acc[key] || { name: key, value: 0 };
        acc[key].value += 1;
        return acc;
      }, {})
    );
  }, [scholarships]);

  return (
    <div className="page-container">
      <div className="scholarships-header">
        <h2 className="page-title">🎓 Scholarship Opportunities</h2>
        <div className="scholarship-counter">
          <span className="counter-label">Active Scholarships:</span>
          <span className="counter-value">{scholarships.length}</span>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="chart-wrapper pie-chart-enhanced">
        <h3 className="chart-title">Scholarship Distribution by Type</h3>
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
                <span className="pie-center-overlay-count">{scholarships.length}</span>
                <span className="pie-center-overlay-label">Total Scholarships</span>
              </div>
            )}
          </div>
          <CustomLegend
            pieData={pieData}
            totalItems={scholarships.length}
            activeIndex={activeIndex}
            onHover={onPieHover}
          />
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading scholarships...</p>
      ) : (
        <div className="exams-grid">
          {scholarships.map((scholarship, index) => (
            <div
              key={scholarship.id}
              className="exam-card-small"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-accent"></div>
              <div className="exam-header">
                <span className="exam-type">{scholarship.category}</span>
                <span
                  className={`status status-${getStatus(
                    scholarship.deadline
                  )}`}
                >
                  {getStatus(scholarship.deadline)}
                </span>
              </div>

              <h4 className="exam-name">{scholarship.name}</h4>
              <p className="exam-desc">{scholarship.description}</p>

              <div className="exam-info">
                <div className="info-row">
                  <span className="info-icon">🎓</span>
                  <span className="info-text">
                    {scholarship.qualificationRequired}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">💰</span>
                  <span className="info-text">{scholarship.amount}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📊</span>
                  <span className="info-text">
                    Income: {scholarship.incomeLimit}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📋</span>
                  <span className="info-text">
                    Caste: {scholarship.casteEligibility}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">👥</span>
                  <span className="info-text">
                    Gender: {scholarship.genderEligibility}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <span className="info-text">
                    Deadline: {formatDate(scholarship.deadline)}
                  </span>
                </div>
              </div>

              {getStatus(scholarship.deadline) === "Closed" ? (
                <button className="btn-apply disabled" disabled>
                  Applications Closed
                </button>
              ) : (
                <a
                  href={scholarship.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-apply"
                >
                  {scholarship.applyLabel || "Apply Now"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Scholarships;
