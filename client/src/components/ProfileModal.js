import React, { useState, useEffect, useRef } from 'react';
import '../styles/TaskManager.css';
import { userService } from '../services/userService';

const ProfileModal = ({ profile, onClose }) => {
  console.log('ProfileModal rendered with profile:', profile);
  
  const [stats, setStats] = useState({ created: 0, assigned: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const modalRef = useRef(null);

  // Handle ESC key to close the modal
  useEffect(() => {
    console.log('ProfileModal mount effect running');
    
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    // Fade in animation on mount
    const timer = setTimeout(() => {
      setIsVisible(true);
      console.log('Modal visibility set to true');
    }, 10);

    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      clearTimeout(timer);
    };
  }, []);
  
  // Initialize editedProfile when profile changes
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.name || '',
        role: profile.role || 'User'
      });
    }
  }, [profile]);

  // Fetch or extract user statistics
  useEffect(() => {
    const getStats = async () => {
      if (profile) {
        try {
          setLoading(true);
          
          // If profile already has stats, use those directly
          if (profile.stats) {
            console.log('Using stats from profile:', profile.stats);
            setStats({
              created: profile.stats.tasksCreated || 0,
              assigned: profile.stats.tasksAssigned || 0,
              completed: profile.stats.tasksCompleted || 0
            });
            setLoading(false);
            return;
          }
          
          // Otherwise fetch stats from API
          if (profile.uid) {
            console.log('Fetching stats for profile:', profile.uid);
            const userStats = await userService.getUserTaskStats(profile.uid);
            console.log('Stats fetched:', userStats);
            setStats(userStats);
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    getStats();
  }, [profile]);

  // Handle smooth closing animation
  const handleClose = () => {
    console.log('Modal close triggered');
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match with the CSS transition duration
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    if (!profile.uid) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    
    try {
      await userService.updateUserProfile(profile.uid, editedProfile);
      setIsEditing(false);
      // Update the displayed profile with new values
      profile.name = editedProfile.name;
      profile.role = editedProfile.role;
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!profile) {
    console.log('No profile provided, returning null');
    return null;
  }
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div 
      className={`modal-backdrop ${isVisible ? 'visible' : ''}`} 
      onClick={handleClose}
    >
      <div 
        className={`profile-modal ${isVisible ? 'visible' : ''}`} 
        onClick={e => e.stopPropagation()}
        ref={modalRef}
      >
        <button className="close-button" onClick={handleClose}>×</button>
        <div className="profile-header">
          <h2>User Profile</h2>
          <button 
            className="edit-profile-button"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        <div className="profile-content">
          <div className="profile-avatar">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder">
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          
          {updateError && <div className="profile-update-error">{updateError}</div>}
          
          <div className="profile-info">
            <div className="profile-field">
              <strong>Name:</strong>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editedProfile.name}
                  onChange={handleInputChange}
                  className="profile-edit-input"
                />
              ) : (
                <span>{profile.name}</span>
              )}
            </div>
            
            <div className="profile-field">
              <strong>Email:</strong>
              <span>{profile.email}</span>
            </div>
            
            <div className="profile-field">
              <strong>Role:</strong>
              {isEditing ? (
                <select
                  name="role"
                  value={editedProfile.role}
                  onChange={handleInputChange}
                  className="profile-edit-select"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
              ) : (
                <span>{profile.role || 'User'}</span>
              )}
            </div>
            
            {profile.lastLogin && (
              <div className="profile-field">
                <strong>Last Login:</strong>
                <span>{formatDate(profile.lastLogin)}</span>
              </div>
            )}
            
            {profile.createdAt && (
              <div className="profile-field">
                <strong>Joined:</strong>
                <span>{formatDate(profile.createdAt)}</span>
              </div>
            )}
            
            {profile.stats && profile.stats.lastTaskCompletedAt && (
              <div className="profile-field">
                <strong>Last Completed:</strong>
                <span>{formatDate(profile.stats.lastTaskCompletedAt)}</span>
              </div>
            )}
          </div>
          
          {isEditing && (
            <div className="profile-actions">
              <button 
                className="save-profile-button"
                onClick={handleSaveProfile}
                disabled={updateLoading}
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          
          <div className="profile-stats">
            {loading ? (
              <div className="stats-loading">Loading stats...</div>
            ) : (
              <>
                <div className="stat">
                  <span className="stat-value">{stats.created}</span>
                  <span className="stat-label">Tasks Created</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.assigned}</span>
                  <span className="stat-label">Assigned Tasks</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.completed}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal; 