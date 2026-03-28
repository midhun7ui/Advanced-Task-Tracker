import React, { useState, useEffect } from 'react';
import { LayoutGrid, CalendarDays, BarChart3, PieChart } from 'lucide-react';
import './GraphicalView.css';

const GraphicalView = ({ tasks, categories = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Keep date accurate if dashboard stays open overnight
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate the week number within the current month (1-5)
  const getWeekNumber = (d) => {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const dayOffset = firstDay.getDay(); 
    return Math.ceil((d.getDate() + dayOffset) / 7);
  };

  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateNum = currentDate.getDate();
  const year = currentDate.getFullYear();
  const weekNum = getWeekNumber(currentDate);

  // Calculate priority counts
  const priorityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  
  // Calculate status counts & urgency
  const statusCounts = { Completed: 0, "In Progress": 0, "To Do": 0, Hold: 0 };
  
  // Calculate category counts
  const categoryCounts = {};
  categories.forEach(c => categoryCounts[c] = 0);
  let dueTodayCount = 0;
  let overdueCount = 0;
  const activeTasks = tasks?.filter(t => !t.state) || [];
  const totalTasks = activeTasks.length;

  if (activeTasks.length > 0) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Local Midnight
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    activeTasks.forEach(t => {
      // 1. Tally Priorities
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
      
      // 2. Tally Statuses
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }

      // 3. Tally Categories (automatically capturing generic or custom bounds)
      if (t.category) {
        if (categoryCounts[t.category] === undefined) {
           categoryCounts[t.category] = 1;
        } else {
           categoryCounts[t.category]++;
        }
      }

      // 4. Tally Urgency (ignoring completed tasks)
      if (t.status !== 'Completed') {
        if (t.dueDate === todayStr) {
          dueTodayCount++;
        } else if (t.dueDate) {
          const [y, m, d] = t.dueDate.split('-');
          const dueDateTime = new Date(y, m - 1, d);
          if (dueDateTime < today) {
            overdueCount++;
          }
        }
      }
    });
  }
  
  const maxCount = Math.max(...Object.values(priorityCounts), 1);
  const percentCompleted = totalTasks > 0 ? Math.round((statusCounts['Completed'] / totalTasks) * 100) : 0;

  // Donut Graph Mathematics
  const activeCategories = Object.entries(categoryCounts).filter(([_, count]) => count > 0);
  const totalCatTasks = activeCategories.reduce((sum, [_, c]) => sum + c, 0);
  
  const getCategoryColor = (index) => {
    const defaultColors = ['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#6b40e3', '#00bfa5', '#e91e63'];
    if (index < defaultColors.length) return defaultColors[index];
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 75%, 53%)`;
  };

  let currentAngle = 0;
  const gradientStops = activeCategories.map(([cat, count], idx) => {
    const percentage = (count / totalCatTasks) * 100;
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentage;
    const color = getCategoryColor(idx);
    currentAngle = endAngle;
    return `${color} ${startAngle}% ${endAngle}%`;
  }).join(', ');
  
  const conicGradient = totalCatTasks > 0 ? `conic-gradient(${gradientStops})` : 'conic-gradient(var(--border-color) 0% 100%)';

  // SVG Mathematics for Radial Polyline Labels
  let currentAngleCSSObj = 0;
  const donutRadius = 65; // half of 130px
  
  const labelData = activeCategories.map(([cat, count], idx) => {
    const percentage = (count / totalCatTasks) * 100;
    const startCSS = currentAngleCSSObj;
    const endCSS = currentAngleCSSObj + percentage;
    currentAngleCSSObj = endCSS;
    
    // Find absolute midpoint of each gradient slice
    const midCSS = startCSS + (percentage / 2);
    const midDeg = (midCSS * 3.6) - 90; // Convert CSS % to standard math degrees (-90 = Top North)
    const midRad = midDeg * (Math.PI / 180);
    
    // Anchor path starting at exact radial edge of the 130x130 CSS Donut
    const x0 = donutRadius + donutRadius * Math.cos(midRad);
    const y0 = donutRadius + donutRadius * Math.sin(midRad);
    
    // Extend primary angle outwards by 22px
    const outerStretch = donutRadius + 15; 
    const x1 = donutRadius + outerStretch * Math.cos(midRad);
    const y1 = donutRadius + outerStretch * Math.sin(midRad);
    
    // Compute terminal horizontal snap-line direction
    const isRightSide = Math.cos(midRad) >= 0;
    const x2 = x1 + (isRightSide ? 12 : -12);
    const y2 = y1;
    
    return {
      cat,
      count,
      color: getCategoryColor(idx),
      x0, y0, x1, y1, x2, y2,
      isRightSide,
      midRad
    };
  });

  return (
    <div className="graphical-view glass-panel">
      <div className="graphical-header">
        <LayoutGrid className="icon" size={20} />
        <h2>Overview Dashboard</h2>
      </div>
      
      <div className="overview-grid">
        {/* Item 1: Custom Calendar Widget */}
        <div className="overview-widget calendar-widget glass-panel">
          <div className="widget-header">
            <CalendarDays size={16} className="widget-icon" />
            <h3>Calendar</h3>
          </div>
          <div className="calendar-content">
            <div className="calendar-left">
              <span className="cal-day-name">{dayName}</span>
              <span className="cal-date-number">{dateNum}</span>
            </div>
            <div className="calendar-right">
              <div className="cal-meta">
                <span className="meta-label">Week</span>
                <span className="meta-value">{weekNum}</span>
              </div>
              <div className="cal-meta">
                <span className="meta-label">Year</span>
                <span className="meta-value">{year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Item 2: Tasks by Priority */}
        <div className="overview-widget glass-panel priority-widget">
          <div className="widget-header">
            <BarChart3 className="widget-icon" size={16} />
            <h3>Tasks By Priority</h3>
          </div>
          <div className="priority-graph">
            {Object.entries(priorityCounts).map(([priority, count]) => {
              const heightPercentage = `${(count / maxCount) * 100}%`;
              const colorClass = `bar-${priority.toLowerCase()}`;
              return (
                <div className="priority-bar-container" key={priority}>
                   <div className="bar-count-label">{count}</div>
                   <div className={`priority-bar ${colorClass}`} style={{ height: heightPercentage }}></div>
                   <span className="priority-label">{priority}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Item 3: Tasks Status Widget */}
        <div className="overview-widget glass-panel status-widget">
          <div className="widget-header">
            <LayoutGrid className="widget-icon" size={16} />
            <h3>TASKS STATUS</h3>
          </div>
          <div className="status-widget-content">
            
            {/* Split Data Section */}
            <div className="status-data-section">
              <div className="status-col">
                <div className="status-row">
                  <span className="s-label"><div className="s-dot" style={{background: '#0f9d58'}}></div>Completed</span>
                  <span className="s-val">{statusCounts['Completed']}</span>
                </div>
                <div className="status-row">
                  <span className="s-label"><div className="s-dot" style={{background: '#00bfa5'}}></div>In Progress</span>
                  <span className="s-val">{statusCounts['In Progress']}</span>
                </div>
                <div className="status-row">
                  <span className="s-label"><div className="s-dot" style={{background: '#4285f4'}}></div>To Do</span>
                  <span className="s-val">{statusCounts['To Do']}</span>
                </div>
                <div className="status-row">
                  <span className="s-label"><div className="s-dot" style={{background: '#64748b'}}></div>Hold</span>
                  <span className="s-val">{statusCounts['Hold']}</span>
                </div>
              </div>

              <div className="status-divider"></div>

              <div className="urgency-col">
                <div className="urgency-block">
                  <span className="u-label">Due Today</span>
                  <span className="u-val">{dueTodayCount}</span>
                </div>
                <div className="urgency-block">
                  <span className="u-label overdue-text">Overdue</span>
                  <span className="u-val overdue-val">{overdueCount}</span>
                </div>
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="status-progress-section">
              <div className="progress-labels">
                <span className="p-text">
                  Completion Rate <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.95em', marginLeft: '6px' }}>({statusCounts['Completed']}/{totalTasks})</span>
                </span>
                <span className="p-percent">{percentCompleted}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{width: `${percentCompleted}%`}}></div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Item 4: Categories Donut Chart */}
        <div className="overview-widget glass-panel categories-widget">
          <div className="widget-header">
            <PieChart className="widget-icon" size={16} />
            <h3>Tasks By Category</h3>
          </div>
          
          <div className="categories-content" style={{ justifyContent: 'center', padding: '20px' }}>
            <div className="donut-chart-container" style={{ position: 'relative', overflow: 'visible' }}>
              <div className="donut-chart" style={{ background: conicGradient }}>
                <div className="donut-hole glass-panel">
                  <span className="donut-total">{totalCatTasks}</span>
                  <span className="donut-label">Tasks</span>
                </div>
                
                {/* Mathematical SVG Polyline Overlay Layer */}
                <svg 
                  width="130" 
                  height="130" 
                  style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 10 }}
                >
                  {labelData.map(d => (
                    <g key={d.cat}>
                      {/* Radial Line Path (Center Edge -> Outward Angle -> Horizontal Snap) */}
                      <path 
                        d={`M ${d.x0} ${d.y0} L ${d.x1} ${d.y1} L ${d.x2} ${d.y2}`} 
                        fill="none" 
                        stroke={d.color} 
                        strokeWidth="1.5"
                        opacity="0.8"
                      />
                      {/* Outer Text Element bound to Horizontal Terminal */}
                      <text 
                        x={d.isRightSide ? d.x2 + 6 : d.x2 - 6} 
                        y={d.y2 + 4} 
                        fill="var(--text-primary)" 
                        fontSize="11px" 
                        fontWeight="600"
                        letterSpacing="0.2px"
                        textAnchor={d.isRightSide ? "start" : "end"}
                      >
                        {d.cat}
                      </text>
                    </g>
                  ))}
                </svg>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphicalView;
