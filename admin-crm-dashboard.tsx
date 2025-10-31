import React, { useState, useEffect } from 'react';
import { Users, Calendar, Bell, Settings, Download, Trash2, Search, Plus, X, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function AdminCRM() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [view, setView] = useState('overview');
  const [allRecords, setAllRecords] = useState([]);
  const [lateAlerts, setLateAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [newNotif, setNewNotif] = useState({
    type: 'announcement',
    title: '',
    description: '',
    date: '',
    priority: 'medium',
    tags: ''
  });

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const records = await window.storage.get('allDailyRecords', true);
      if (records) setAllRecords(JSON.parse(records.value));
      
      const alerts = await window.storage.list('lateAlert_', true);
      if (alerts && alerts.keys) {
        const lateData = [];
        for (const key of alerts.keys) {
          const alert = await window.storage.get(key, true);
          if (alert) lateData.push(JSON.parse(alert.value));
        }
        setLateAlerts(lateData);
      }
    } catch (e) {}
  };

  const handleLogin = () => {
    if (adminPass === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid password');
    }
  };

  const sendNotification = async () => {
    if (!newNotif.title || !newNotif.description) {
      alert('Fill all fields');
      return;
    }

    const notification = {
      id: 'n_' + Date.now(),
      type: newNotif.type,
      title: newNotif.title,
      description: newNotif.description,
      date: newNotif.date || new Date().toISOString(),
      priority: newNotif.priority,
      tags: newNotif.tags.split(',').map(t => t.trim()).filter(t => t),
      read: false
    };

    try {
      const userKeys = await window.storage.list('notifications_');
      if (userKeys && userKeys.keys) {
        for (const key of userKeys.keys) {
          const existing = await window.storage.get(key);
          if (existing) {
            const notifs = JSON.parse(existing.value);
            notifs.push(notification);
            await window.storage.set(key, JSON.stringify(notifs));
          }
        }
      }
      
      alert('Notification sent!');
      setShowNotifModal(false);
      setNewNotif({type: 'announcement', title: '', description: '', date: '', priority: 'medium', tags: ''});
    } catch (e) {
      alert('Failed to send');
    }
  };

  const exportData = () => {
    const data = {records: allRecords, lateAlerts: lateAlerts, exportDate: new Date().toISOString()};
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Exported!');
  };

  const clearHouse = async () => {
    try {
      exportData();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 1);
      const recent = allRecords.filter(r => new Date(r.checkInTime) > cutoff);
      await window.storage.set('allDailyRecords', JSON.stringify(recent), true);
      const alertKeys = await window.storage.list('lateAlert_', true);
      if (alertKeys && alertKeys.keys) {
        for (const key of alertKeys.keys) {
          await window.storage.delete(key, true);
        }
      }
      setAllRecords(recent);
      setLateAlerts([]);
      setShowClearModal(false);
      alert('Clear House complete!');
      loadData();
    } catch (e) {
      alert('Failed');
    }
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayRecords = allRecords.filter(r => new Date(r.checkInTime).toDateString() === today);
    const clockedIn = todayRecords.filter(r => r.checkInTime && !r.checkOutTime).length;
    const completed = todayRecords.filter(r => r.checkOutTime).length;
    const late = todayRecords.filter(r => r.status === 'late').length;
    return {total: todayRecords.length, clockedIn, completed, late};
  };

  const filtered = allRecords.filter(r => 
    r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin CRM</h1>
            <p className="text-gray-400">Management Dashboard</p>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            className="w-full px-4 py-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">Login</button>
          <p className="text-gray-500 text-sm text-center mt-6">Demo: admin123</p>
        </div>
      </div>
    );
  }

  const stats = getTodayStats();
  const nav = [
    {id: 'overview', icon: Calendar, label: 'Overview'},
    {id: 'records', icon: Users, label: 'Records'},
    {id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: lateAlerts.length},
    {id: 'notifications', icon: Bell, label: 'Notifications'},
    {id: 'settings', icon: Settings, label: 'Settings'}
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400">Admin CRM</h1>
          <div className="flex items-center space-x-4">
            <button onClick={exportData} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button onClick={() => setShowClearModal(true)} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              <Trash2 className="w-4 h-4" />
              <span>Clear House</span>
            </button>
            <button onClick={() => setIsLoggedIn(false)} className="text-gray-400 hover:text-white">Logout</button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-gray-800 min-h-screen border-r border-gray-700 p-4">
          <nav className="space-y-2">
            {nav.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={'w-full flex items-center justify-between px-4 py-3 rounded-lg ' + (view === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700')}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {view === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Overview - Today</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400">Total</h3>
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400">Working</h3>
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-green-400">{stats.clockedIn}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400">Late</h3>
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">{stats.late}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-400">Complete</h3>
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                {allRecords.slice(-10).reverse().map(rec => (
                  <div key={rec.id} className="bg-gray-700 rounded-lg p-4 mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {rec.checkInPhoto && <img src={rec.checkInPhoto} alt="In" className="w-12 h-12 rounded-full object-cover cursor-pointer" onClick={() => setSelectedPhoto(rec.checkInPhoto)} />}
                      <div>
                        <p className="font-semibold">{rec.userName}</p>
                        <p className="text-sm text-gray-400">{new Date(rec.checkInTime).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={'px-3 py-1 rounded-full text-xs ' + (rec.status === 'late' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300')}>
                      {rec.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'records' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">All Records</h2>
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Photo</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">In</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Out</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filtered.slice().reverse().map(rec => (
                      <tr key={rec.id}>
                        <td className="px-6 py-4">
                          {rec.checkInPhoto ? (
                            <img src={rec.checkInPhoto} alt="In" className="w-10 h-10 rounded-full object-cover cursor-pointer" onClick={() => setSelectedPhoto(rec.checkInPhoto)} />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold">{rec.userName}</td>
                        <td className="px-6 py-4 text-sm">{rec.date}</td>
                        <td className="px-6 py-4 text-sm">{new Date(rec.checkInTime).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 text-sm">{rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : '-'}</td>
                        <td className="px-6 py-4 text-sm">{rec.totalHours || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={'px-3 py-1 rounded-full text-xs ' + (rec.status === 'late' ? 'bg-yellow-900 text-yellow-300' : rec.status === 'completed' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300')}>
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'alerts' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Alerts</h2>
              {lateAlerts.length > 0 ? lateAlerts.map((alert, i) => (
                <div key={i} className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-yellow-300">Late Arrival</h3>
                      <p className="text-gray-300 mt-2">{alert.userName}</p>
                      <p className="text-gray-400 text-sm">{new Date(alert.time).toLocaleString()}</p>
                      <p className="text-yellow-400 font-semibold mt-1">Late: {alert.minutesLate} min</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-yellow-400" />
                  </div>
                </div>
              )) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No alerts!</p>
                </div>
              )}
            </div>
          )}

          {view === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Notifications</h2>
                <button onClick={() => setShowNotifModal(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  <Plus className="w-5 h-5" />
                  <span>New</span>
                </button>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Notification Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-300 mb-2">Training</h4>
                    <p className="text-sm text-gray-400">Sessions, workshops</p>
                  </div>
                  <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-300 mb-2">QA Session</h4>
                    <p className="text-sm text-gray-400">Reviews, feedback</p>
                  </div>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-300 mb-2">Announcement</h4>
                    <p className="text-sm text-gray-400">Updates, holidays</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Settings</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Data</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold">Records</p>
                      <p className="text-sm text-gray-400">{allRecords.length} total</p>
                    </div>
                    <button onClick={exportData} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Export</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold">Clear House</p>
                      <p className="text-sm text-gray-400">Backup and remove old data</p>
                    </div>
                    <button onClick={() => setShowClearModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Clear</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showNotifModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Create Notification</h3>
              <button onClick={() => setShowNotifModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <select value={newNotif.type} onChange={(e) => setNewNotif({...newNotif, type: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                <option value="training">Training</option>
                <option value="qa_session">QA Session</option>
                <option value="announcement">Announcement</option>
              </select>
              <select value={newNotif.priority} onChange={(e) => setNewNotif({...newNotif, priority: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input type="text" value={newNotif.title} onChange={(e) => setNewNotif({...newNotif, title: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Title" />
              <textarea value={newNotif.description} onChange={(e) => setNewNotif({...newNotif, description: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24" placeholder="Description" />
              <input type="datetime-local" value={newNotif.date} onChange={(e) => setNewNotif({...newNotif, date: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
              <input type="text" value={newNotif.tags} onChange={(e) => setNewNotif({...newNotif, tags: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Tags (comma separated)" />
              <div className="flex space-x-3">
                <button onClick={sendNotification} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">Send to All</button>
                <button onClick={() => setShowNotifModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-red-700">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h3 className="text-2xl font-bold text-red-300">Clear House</h3>
            </div>
            <p className="text-gray-300 mb-4">This will:</p>
            <ul className="list-disc list-inside text-gray-400 mb-6 space-y-2">
              <li>Export backup of all data</li>
              <li>Delete records older than 1 month</li>
              <li>Clear all late alerts</li>
              <li>Free up storage space</li>
            </ul>
            <div className="flex space-x-3">
              <button onClick={clearHouse} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg">Proceed</button>
              <button onClick={() => setShowClearModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-4xl w-full">
            <img src={selectedPhoto} alt="Full" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}