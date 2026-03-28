import React, { useState, useEffect, useRef } from 'react';
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
  const [announcement, setAnnouncement] = useState('');
  const announcementRef = useRef(null);
  
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

  const announce = (msg) => {
    setAnnouncement(msg);
    // Clear after a delay to allow re-announcement of same message if needed
    setTimeout(() => setAnnouncement(''), 3000);
  };

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
    setTasks(tasks.map(t => t.id === id ? { ...t, state: newState } : t));
    announce(newState ? `Task "${task.task}" marked as completed` : `Task "${task.task}" marked as active`);
    try {
      await updateDoc(doc(db, 'tasks', id), { state: newState });
    } catch(err) { console.error('Firestore sync error:', err); }
  };

  const updateTaskStatus = async (id, newStatus) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    announce(`Status of "${task?.task}" updated to ${newStatus}`);
    try {
      await updateDoc(doc(db, 'tasks', id), { status: newStatus });
    } catch(err) { console.error('Firestore sync error:', err); }
  };

  const updateTaskPriority = async (id, newPriority) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.map(t => t.id === id ? { ...t, priority: newPriority } : t));
    announce(`Priority of "${task?.task}" set to ${newPriority}`);
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

  const handleKeyDown = (e, taskId, type, isStateLocked) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDropdownClick(e, taskId, type, isStateLocked);
    }
    if (e.key === 'Escape') {
      setOpenDropdown(null);
    }
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
      userId: auth.currentUser.uid,
      ...newTask
    };
    
    try {
      const docRef = await addDoc(collection(db, 'tasks'), taskEntryObj);
      setTasks([...tasks, { id: docRef.id, ...taskEntryObj }]);
      setIsModalOpen(false);
      announce(`Task "${newTask.task}" added successfully`);
      setNewTask({ task: '', category: categories.length > 0 ? categories[0] : '', priority: 'Medium', dueDate: '', status: 'To Do', notes: '' });
    } catch(err) { console.error('Firestore Insert error:', err); }
  };

  const handleDeleteCategory = async (catToDelete) => {
    if (!auth.currentUser) return;
    if (setCategories) {
      const updatedCategories = categories.filter(cat => cat !== catToDelete);
      setCategories(updatedCategories);
      announce(`Category "${catToDelete}" deleted`);
      
      if (newTask.category === catToDelete) {
        setNewTask({ ...newTask, category: updatedCategories.length > 0 ? updatedCategories[0] : '' });
      }
      
      try {
        await deleteDoc(doc(db, 'categories', `${auth.currentUser.uid}_${catToDelete}`));
      } catch(err) { console.error('Firestore delete error:', err); }
    }
  };

  const handleDeleteTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter(t => t.id !== id));
    announce(`Task "${task?.task}" deleted`);
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch(err) { console.error('Firestore Delete Task Error:', err); }
  };

  return (
    <div className="task-table-container glass-panel">
      {/* Visual accessibility announcer */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: '0' }}
      >
        {announcement}
      </div>

      <div className="table-header-controls">
        <h2>Active Tasks</h2>
        <button 
          className="add-task-btn" 
          onClick={() => setIsModalOpen(true)}
          aria-label="Add a new task"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Task</span>
        </button>
      </div>
      
      <div className="table-wrapper">
        <table className="task-table">
          <caption className="sr-only">List of active and completed tasks with priority, status, and due dates</caption>
          <thead>
            <tr>
              <th scope="col" className="col-state">State</th>
              <th scope="col" className="col-date">Date Entered</th>
              <th scope="col" className="col-task">Task</th>
              <th scope="col" className="col-category">Category/Project</th>
              <th scope="col" className="col-priority">Priority</th>
              <th scope="col" className="col-due">Due Date</th>
              <th scope="col" className="col-days">Days Left</th>
              <th scope="col" className="col-status">Status</th>
              <th scope="col" className="col-notes">Notes</th>
              <th scope="col" className="col-actions"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody ref={parent}>
            {[...tasks].sort((a, b) => {
              if (a.state !== b.state) return a.state ? 1 : -1;
              const statusOrder = { 'To Do': 1, 'In Progress': 2, 'Hold': 3, 'Completed': 4 };
              const orderA = statusOrder[a.status] || 99;
              const orderB = statusOrder[b.status] || 99;
              if (orderA !== orderB) return orderA - orderB;
              return a.id - b.id;
            }).map(task => (
              <tr key={task.id} className={task.state ? 'task-completed' : ''}>
                <td className="col-state">
                  <button 
                    className="state-toggle" 
                    onClick={() => toggleTaskState(task.id)}
                    aria-label={task.state ? `Mark "${task.task}" as active` : `Mark "${task.task}" as completed`}
                  >
                    {task.state ? <CheckSquare size={18} className="checked" aria-hidden="true" /> : <Square size={18} className="unchecked" aria-hidden="true" />}
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
                      onKeyDown={(e) => handleKeyDown(e, task.id, 'priority', task.state)}
                      tabIndex={task.state ? -1 : 0}
                      role="button"
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown?.id === task.id && openDropdown?.type === 'priority'}
                      aria-label={`Priority: ${task.priority}. Click to change.`}
                    >
                      <Flag size={12} aria-hidden="true" />
                      {task.priority}
                    </div>
                    {openDropdown?.id === task.id && openDropdown?.type === 'priority' && (
                      <div className={`custom-dropdown-menu ${openDropdown.renderUpwards ? 'drop-up' : ''}`} role="listbox">
                        <div role="option" aria-selected={task.priority === 'Low'} className="custom-option option-low" onClick={() => { updateTaskPriority(task.id, 'Low'); setOpenDropdown(null); }}>Low</div>
                        <div role="option" aria-selected={task.priority === 'Medium'} className="custom-option option-medium" onClick={() => { updateTaskPriority(task.id, 'Medium'); setOpenDropdown(null); }}>Medium</div>
                        <div role="option" aria-selected={task.priority === 'High'} className="custom-option option-high" onClick={() => { updateTaskPriority(task.id, 'High'); setOpenDropdown(null); }}>High</div>
                        <div role="option" aria-selected={task.priority === 'Critical'} className="custom-option option-critical" onClick={() => { updateTaskPriority(task.id, 'Critical'); setOpenDropdown(null); }}>Critical</div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="col-due">
                  <div className="date-cell">
                    <Calendar size={14} aria-hidden="true" />
                    <span aria-label={`Due date: ${task.dueDate}`}>{task.dueDate}</span>
                  </div>
                </td>
                <td className="col-days">
                  <div className={`days-badge ${calculateDaysLeft(task.dueDate) <= 2 ? 'days-urgent' : ''}`}>
                    <Clock size={12} aria-hidden="true" />
                    <span>{calculateDaysLeft(task.dueDate)}d left</span>
                  </div>
                </td>
                <td className="col-status">
                  <div className="custom-dropdown-container">
                    <div 
                      className={`status-badge custom-dropdown-toggle ${getStatusColor(task.status)}`}
                      onClick={(e) => handleDropdownClick(e, task.id, 'status', task.state)}
                      onKeyDown={(e) => handleKeyDown(e, task.id, 'status', task.state)}
                      tabIndex={task.state ? -1 : 0}
                      role="button"
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown?.id === task.id && openDropdown?.type === 'status'}
                      aria-label={`Status: ${task.status}. Click to change.`}
                    >
                      {task.status}
                    </div>
                    {openDropdown?.id === task.id && openDropdown?.type === 'status' && (
                      <div className={`custom-dropdown-menu ${openDropdown.renderUpwards ? 'drop-up' : ''}`} role="listbox">
                        <div role="option" aria-selected={task.status === 'To Do'} className="custom-option" style={{color: '#4285f4'}} onClick={() => { updateTaskStatus(task.id, 'To Do'); setOpenDropdown(null); }}>To Do</div>
                        <div role="option" aria-selected={task.status === 'In Progress'} className="custom-option" style={{color: '#00bfa5'}} onClick={() => { updateTaskStatus(task.id, 'In Progress'); setOpenDropdown(null); }}>In Progress</div>
                        <div role="option" aria-selected={task.status === 'Completed'} className="custom-option" style={{color: '#0f9d58'}} onClick={() => { updateTaskStatus(task.id, 'Completed'); setOpenDropdown(null); }}>Completed</div>
                        <div role="option" aria-selected={task.status === 'Hold'} className="custom-option" style={{color: '#64748b'}} onClick={() => { updateTaskStatus(task.id, 'Hold'); setOpenDropdown(null); }}>Hold</div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="col-notes">
                  <div className="notes-container">
                    <MessageSquare size={14} className="notes-icon" aria-hidden="true" />
                    <span className="notes-text" title={task.notes}>{task.notes}</span>
                  </div>
                </td>
                <td className="col-actions">
                  <button 
                    className="delete-task-btn" 
                    onClick={() => handleDeleteTask(task.id)}
                    aria-label={`Delete task: ${task.task}`}
                    title="Delete Task"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3 id="modal-title">Add New Task</h3>
              <button 
                className="close-btn" 
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="add-task-form">
              <div className="form-group">
                <label htmlFor="task-desc">Task Description</label>
                <input 
                  id="task-desc"
                  required 
                  type="text" 
                  placeholder="What needs to be done?" 
                  value={newTask.task} 
                  onChange={e => setNewTask({...newTask, task: e.target.value})} 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label id="cat-label">Category/Project</label>
                  <div className="custom-dropdown-container">
                    <div 
                      className="form-select-custom custom-dropdown-toggle"
                      tabIndex={0}
                      role="button"
                      aria-labelledby="cat-label"
                      aria-haspopup="listbox"
                      aria-expanded={openDropdown?.id === 'newTask' && openDropdown?.type === 'category'}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.currentTarget.click();
                        }
                      }}
                    >
                      {newTask.category || 'Select a category'}
                    </div>
                    {openDropdown?.id === 'newTask' && openDropdown?.type === 'category' && (
                      <div className={`custom-dropdown-menu ${openDropdown.renderUpwards ? 'drop-up' : ''}`} style={{ width: '100%', minWidth: '200px' }} role="listbox">
                        <div className="custom-dropdown-scrollable">
                          {categories.map(cat => (
                            <div key={cat} className="custom-option category-dropdown-option" role="option" aria-selected={newTask.category === cat}>
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
                                aria-label={`Delete category ${cat}`}
                              >
                                <Trash2 size={14} aria-hidden="true" />
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
                      aria-label="Type new category name"
                      placeholder="New Category..." 
                      value={newCategoryTerm}
                      onChange={(e) => setNewCategoryTerm(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px' }}
                    />
                    <button 
                      type="button" 
                      className="cat-add-btn"
                      aria-label="Add new category"
                      style={{ padding: '8px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={async () => {
                        const term = newCategoryTerm.trim();
                        if (term && setCategories && !categories.includes(term)) {
                          setCategories([...categories, term]);
                          setNewTask({...newTask, category: term});
                          setNewCategoryTerm('');
                          try {
                            if (!auth.currentUser) return;
                            await setDoc(doc(db, 'categories', `${auth.currentUser.uid}_${term}`), { name: term, userId: auth.currentUser.uid });
                          } catch(err) { console.error('Firestore sync error:', err); }
                        }
                      }}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select 
                    id="task-priority"
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
                  <label htmlFor="task-due">Due Date</label>
                  <input 
                    id="task-due"
                    required 
                    type="date" 
                    value={newTask.dueDate} 
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="task-status">Status</label>
                  <select 
                    id="task-status"
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
                <label htmlFor="task-notes">Notes</label>
                <textarea 
                  id="task-notes"
                  rows="3" 
                  placeholder="Additional details..." 
                  value={newTask.notes} 
                  onChange={e => setNewTask({...newTask, notes: e.target.value})}
                ></textarea>
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

