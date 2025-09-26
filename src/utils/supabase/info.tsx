/* SECURE CONFIGURATION - Uses Environment Variables */

import { getConfig } from '../config';

// Extract project ID from environment variable URL (lazy loading)
const getProjectId = (): string => {
  try {
    const config = getConfig();
    
    if (!config.supabaseUrl) {
      console.warn('⚠️ No Supabase URL configured, using fallback');
      return 'wlxmcgoxsepwbnfdgxvq';
    }
    
    const urlObject = new URL(config.supabaseUrl);
    const projectId = urlObject.hostname.split('.')[0];
    
    if (!projectId) {
      console.warn('⚠️ Could not extract project ID, using fallback');
      return 'wlxmcgoxsepwbnfdgxvq';
    }
    
    return projectId;
  } catch (error) {
    console.warn('⚠️ Error parsing Supabase URL, using fallback:', error);
    return 'wlxmcgoxsepwbnfdgxvq';
  }
};

// Lazy getters for project configuration
export const projectId = getProjectId();

export const publicAnonKey = (() => {
  try {
    const config = getConfig();
    return config.supabaseAnonKey || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s';
  } catch (error) {
    console.warn('⚠️ Error getting anon key, using fallback');
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s';
  }
})();