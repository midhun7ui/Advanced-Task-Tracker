import React, { useState, useEffect } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { createPortal } from 'react-dom';
import { MoreVertical, Plus, Calendar, Flag, MessageSquare, CheckSquare, Square, Clock, X, Trash2 } from 'lucide-react';
import './TaskTable.css';

import { db, auth } from '../../firebase/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const getPriorityColor = (priority) => {
  switch(priority) {
    case 'High': return 'priority-high';
    case 'Medium': return 'priority-medium';
    case 'Low': return 'priority-low';
    case 'Critical': return 'priority-critical';
    default: return '';
  }
};

const getStatusColor = (status) => {
  switch(status) {
    case 'Completed': return 'status-completed';
    case 'In Progress': return 'status-progress';
    case 'To Do': return 'status-todo';
    case 'Hold': return 'status-hold';
    default: return '';
  }
};

const TaskTable = ({ tasks, setTasks, categories = [], setCategories }) => {
  const [parent] = useAutoAnimate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [newCategoryTerm, setNewCategoryTerm] = useState('');
  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.custom-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openDropdown]);

  const [newTask, setNewTask] = useState({
    task: '',
    category: categories.length > 0 ? categories[0] : '',
    priority: 'Medium',
    dueDate: '',
    status: 'To Do',
    notes: ''
  });

  const toggleTaskState = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newState = !task.state;
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, state: newState } : t));
    try {
      await updateDoc(doc(db, 'tasks', id), { state: newState });
    } catch(err) { console.error('Firestore sync error:', err); }
  };

  const updateTaskStatus = async (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await updateDoc(doc(db, 'tasks', id), { status: newStatus });
    } catch(err) { console.error('Firestore sync error:', err); }
  };

  const updateTaskPriority = async (id, newPriority) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, priority: newPriority } : t));
    try {
      await updateDoc(doc(db, 'tasks', id), { priority: newPriority });
    } catch(err) { console.error('Firestore sync error:', err); }
  };

  const handleDropdownClick = (e, taskId, type, isStateLocked) => {
    e.stopPropagation();
    if (isStateLocked) return;
    
    if (openDropdown?.id === taskId && openDropdown?.type === type) {
      setOpenDropdown(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    const renderUpwards = spaceBelow < 180 && spaceAbove > 180;
    
    setOpenDropdown({ id: taskId, type, renderUpwards });
  };

  const calculateDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const dateEntered = new Date().toISOString().split('T')[0];
    
    const taskEntryObj = {
      state: false,
      dateEntered,
      userId: auth.currentUser.uid, // Tie task strictly to user
      ...newTask
    };
    
    try {
      const docRef = await addDoc(collection(db, 'tasks'), taskEntryObj);
      setTasks([...tasks, { id: docRef.id, ...taskEntryObj }]);
      setIsModalOpen(false);
      setNewTask({ task: '', category: categories.length > 0 ? categories[0] : '', priority: 'Medium', dueDate: '', status: 'To Do', notes: '' });
    } catch(err) { console.error('Firestore Insert error:', err); }
  };

  const handleDeleteCategory = async (catToDelete) => {
    if (!auth.currentUser) return;
    if (setCategories) {
      const updatedCategories = categories.filter(cat => cat !== catToDelete);
      setCategories(updatedCategories);
      
      if (newTask.category === catToDelete) {
        setNewTask({ ...newTask, category: updatedCategories.length > 0 ? updatedCategories[0] : '' });
      }
      
      try {
        await deleteDoc(doc(db, 'categories', `${auth.currentUser.uid}_${catToDelete}`));
      } catch(err) { console.error('Firestore delete error:', err); }
    }
  };

  const handleDeleteTask = async (id) => {
    // Optimistic update
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch(err) { console.error('Firestore Delete Task Error:', err); }
  };

  return (
    <div className="task-table-container glass-panel">
      <div className="table-header-controls">
        <h2>Active Tasks</h2>
        <button className="add-task-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Add Task
        </button>
      </div>
      
      <div className="table-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th className="col-state">state</th>
              <th className="col-date">DATE ENTERED</th>
              <th className="col-task">TASK</th>
              <th className="col-category">CATEGORY/PROJECT</th>
              <th className="col-priority">priority</th>
              <th className="col-due">due date</th>
              <th className="col-days">day left</th>
              <th className="col-status">Status</th>
              <th className="col-notes">Notes</th>
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody ref={parent}>
            {[...tasks].sort((a, b) => {
              // 1. Separate Active vs Completed visually
              if (a.state !== b.state) return a.state ? 1 : -1;
              
              // 2. Custom 4-Tier Hierarchy defined by user
              const statusOrder = { 'To Do': 1, 'In Progress': 2, 'Hold': 3, 'Completed': 4 };
              const orderA = statusOrder[a.status] || 99;
              const orderB = statusOrder[b.status] || 99;
              if (orderA !== orderB) return orderA - orderB;
              
              return a.id - b.id; // 3. Keep chronological sort strictly for identical tiers
            }).map(task => (
              <tr key={task.id} className={task.state ? 'task-completed' : ''}>
                <td className="col-state">
                  <button className="state-toggle" onClick={() => toggleTaskState(task.id)}>
                    {task.state ? <CheckSquare size={18} className="checked" /> : <Square size={18} className="unchecked" />}
                  </button>
                </td>
                <td className="col-date">{task.dateEntered}</td>
                <td className="col-task">
                  <div className="task-cell-content">
                    {task.task}
                  </div>
                </td>
                <td className="col-category">
                  <span className="category-tag">{task.category}</span>
                </td>
                <td className="col-priority">
                  <div className="custom-dropdown-container">
                    <div 
                      className={`priority-badge custom-dropdown-toggle ${getPriorityColor(task.priority)}`}
                      onClick={(e) => handleDropdownClick(e, task.id, 'priority', task.state)}
                    >
                      <Flag size={12} />
                      {task.priority}
                    </div>
                    {openDropdown?.id === task.id && openDropdown?.type === 'priority' && (
                      <div className={`custom-dropdown-menu ${openDropdown.renderUpwards ? 'drop-up' : ''}`}>
                        <div className="custom-option option-low" onClick={() => { updateTaskPriority(task.id, 'Low'); setOpenDropdown(null); }}>Low</div>
                        <div className="custom-option option-medium" onClick={() => { updateTaskPriority(task.id, 'Medium'); setOpenDropdown(null); }}>Medium</div>
                        <div className="custom-option option-high" onClick={() => { updateTaskPriority(task.id, 'High'); setOpenDropdown(null); }}>High</div>
                        <div className="custom-option option-critical" onClick={() => { updateTaskPriority(task.id, 'Critical'); setOpenDropdown(null); }}>Critical</div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="col-due">
                  <div className="date-cell">
                    <Calendar size={14} />
                    {task.dueDate}
                  </div>
                </td>
                <td className="col-days">
                  <div className={`days-badge ${calculateDaysLeft(task.dueDate) <= 2 ? 'days-urgent' : ''}`}>
                    <Clock size={12} />
                    {calculateDaysLeft(task.dueDate)}d
                  </div>
                </td>
                <td className="col-status">
                  <div className="custom-dropdown-container">
                    <div 
                      className={`status-badge custom-dropdown-toggle ${getStatusColor(task.status)}`}
                      onClick={(e) => handleDropdownClick(e, task.id, 'status', task.state)}
                    >
                      {task.status}
                    </div>
                    {openDropdown?.id === task.id && openDropdown?.type === 'status' && (
                      <div className={`custom-dropdown-menu ${openDropdown.renderUpwards ? 'drop-up' : ''}`}>
                        <div className="custom-option" style={{color: '#4285f4'}} onClick={() => { updateTaskStatus(task.id, 'To Do'); setOpenDropdown(null); }}>To Do</div>
                        <div className="custom-option" style={{color: '#00bfa5'}} onClick={() => { updateTaskStatus(task.id, 'In Progress'); setOpenDropdown(null); }}>In Progress</div>
                        <div className="custom-option" style={{color: '#0f9d58'}} onClick={() => { updateTaskStatus(task.id, 'Completed'); setOpenDropdown(null); }}>Completed</div>
                        <div className="custom-option" style={{color: '#64748b'}} onClick={() => { updateTaskStatus(task.id, 'Hold'); setOpenDropdown(null); }}>Hold</div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="col-notes">
                  <div className="notes-container">
                    <MessageSquare size={14} className="notes-icon" />
                    <span className="notes-text" title={task.notes}>{task.notes}</span>
                  </div>
                </td>
                <td className="col-actions">
                  <button 
                    className="delete-task-btn" 
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="add-task-form">
              <div className="form-group">
                <label>Task Description</label>
                <input required type="text" placeholder="What needs to be done?" value={newTask.task} onChange={e => setNewTask({...newTask, task: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category/Project</label>
                  <div className="custom-dropdown-container">
                    <div 
                      className="form-select-custom custom-dropdown-toggle"
                      onClick={(e) => {
                        if (openDropdown?.id === 'newTask' && openDropdown?.type === 'category') {
                          setOpenDropdown(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setOpenDropdown({
                            id: 'newTask',
                            type: 'category',
                            renderUpwards: window.innerHeight - rect.bottom < 150
                          });
                        }
                      }}
                    >
                      {newTask.category || 'Select a category'}
                    </div>
                    {openDropdown?.id === 'newTask' && openDropdown?.type === 'category' && (
                      <div className={`custom-dropdown-menu ${openDropdown.renderUpwards ? 'drop-up' : ''}`} style={{ width: '100%', minWidth: '200px' }}>
                        <div className="custom-dropdown-scrollable">
                          {categories.map(cat => (
                            <div key={cat} className="custom-option category-dropdown-option">
                              <span 
                                className="cat-option-text" 
                                onClick={() => { setNewTask({...newTask, category: cat}); setOpenDropdown(null); }}
                              >
                                {cat}
                              </span>
                              <button 
                                type="button" 
                                className="delete-category-inline-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(cat);
                                }}
                                title={`Delete ${cat}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="add-category-wrapper" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="New Category..." 
                      value={newCategoryTerm}
                      onChange={(e) => setNewCategoryTerm(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px' }}
                    />
                    <button 
                      type="button" 
                      className="cat-add-btn"
                      style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={async () => {
                        const term = newCategoryTerm.trim();
                        if (term && setCategories && !categories.includes(term)) {
                          // Optimistically add to UI map
                          setCategories([...categories, term]);
                          setNewTask({...newTask, category: term});
                          setNewCategoryTerm('');
                          
                          // Push synchronously explicitly to Firestore Cloud Collections
                          try {
                            if (!auth.currentUser) return;
                            await setDoc(doc(db, 'categories', `${auth.currentUser.uid}_${term}`), { name: term, userId: auth.currentUser.uid });
                          } catch(err) { console.error('Firestore sync error:', err); }
                        }
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    value={newTask.priority} 
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    className={
                      newTask.priority === 'Low' ? 'select-low' : 
                      newTask.priority === 'Medium' ? 'select-medium' : 
                      newTask.priority === 'High' ? 'select-high' : 
                      newTask.priority === 'Critical' ? 'select-critical' : ''
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input required type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={newTask.status} 
                    onChange={e => setNewTask({...newTask, status: e.target.value})}
                    className={
                      newTask.status === 'Completed' ? 'select-completed' : 
                      newTask.status === 'In Progress' ? 'select-progress' : 
                      newTask.status === 'To Do' ? 'select-todo' : 
                      newTask.status === 'Hold' ? 'select-hold' : ''
                    }
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Hold">Hold</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows="3" placeholder="Additional details..." value={newTask.notes} onChange={e => setNewTask({...newTask, notes: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={!newTask.task}>Add Task</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskTable;
