/**
 * Charts Component
 * Data visualization using Recharts for analytics
 */

import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import '../styles/Charts.css';

const Charts = ({ data = {} }) => {
  // Sample data for scholarship statistics
  const scholarshipData = [
    { name: 'STEM', value: 45 },
    { name: 'Commerce', value: 25 },
    { name: 'Arts', value: 15 },
    { name: 'Other', value: 15 }
  ];

  // Sample data for category distribution
  const categoryData = [
    { name: 'General', eligible: 120, ineligible: 45 },
    { name: 'OBC', eligible: 85, ineligible: 20 },
    { name: 'SC', eligible: 60, ineligible: 10 },
    { name: 'ST', eligible: 40, ineligible: 8 }
  ];

  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

  return (
    <motion.div
      className="charts-container"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Pie Chart */}
      <div className="chart-box">
        <h3 className="chart-title">Scholarships by Stream</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={scholarshipData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {scholarshipData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} scholarships`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="chart-box">
        <h3 className="chart-title">Eligibility by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="eligible" fill="#2ecc71" name="Eligible" />
            <Bar dataKey="ineligible" fill="#e74c3c" name="Ineligible" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default Charts;
