import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Property, Inspection, FinancialRecord, MonthlyReset, Invoice, PricingSettings, InspectionType, Room, ProcessedBillingPeriod, ProcessedAgentCashback } from '../types';
import { apiClient } from '../utils/api';

// Default pricing structure based on bedrooms
const DEFAULT_INSPECTION_PRICING: Record<InspectionType, Record<number, number>> = {
  routine: {
    0: 50, // Studio
    1: 75,
    2: 100,
    3: 125,
    4: 150,
    5: 175,
  },
  fire_safety: {
    0: 60,
    1: 85,
    2: 110,
    3: 135,
    4: 160,
    5: 185,
  },
  check_in: {
    0: 80,
    1: 105,
    2: 130,
    3: 155,
    4: 180,
    5: 205,
  },
  check_out: {
    0: 90,
    1: 115,
    2: 140,
    3: 165,
    4: 190,
    5: 215,
  },
};

interface AppState {
  currentUser: User | null;
  users: User[];
  properties: Property[];
  inspections: Inspection[];
  rooms: Room[];
  financialRecords: FinancialRecord[];
  monthlyResets: MonthlyReset[];
  invoices: Invoice[];
  processedBillingPeriods: ProcessedBillingPeriod[];
  processedAgentCashbacks: ProcessedAgentCashback[];
  pricingSettings: PricingSettings[];
  isLoading: boolean;
  accessToken: string | null;
}

type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_ACCESS_TOKEN'; payload: string | null }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_PROPERTY'; payload: Property }
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'UPDATE_PROPERTY'; payload: Property }
  | { type: 'SET_INSPECTIONS'; payload: Inspection[] }
  | { type: 'ADD_INSPECTION'; payload: Inspection }
  | { type: 'UPDATE_INSPECTION'; payload: Inspection }
  | { type: 'ADD_ROOM'; payload: Room }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'SET_PROCESSED_BILLING_PERIODS'; payload: ProcessedBillingPeriod[] }
  | { type: 'ADD_PROCESSED_BILLING_PERIOD'; payload: ProcessedBillingPeriod }
  | { type: 'SET_PROCESSED_AGENT_CASHBACKS'; payload: ProcessedAgentCashback[] }
  | { type: 'ADD_PROCESSED_AGENT_CASHBACKS'; payload: ProcessedAgentCashback[] }
  | { type: 'SET_PRICING_SETTINGS'; payload: PricingSettings[] }
  | { type: 'UPDATE_PRICING'; payload: PricingSettings }
  | { type: 'SET_FINANCIAL_RECORDS'; payload: FinancialRecord[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  currentUser: null,
  users: [],
  properties: [],
  inspections: [],
  rooms: [],
  financialRecords: [],
  monthlyResets: [],
  invoices: [],
  processedBillingPeriods: [],
  processedAgentCashbacks: [],
  pricingSettings: [],
  isLoading: false,
  accessToken: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'SET_ACCESS_TOKEN':
      return { ...state, accessToken: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload };
    
    case 'ADD_PROPERTY':
      return { ...state, properties: [...state.properties, action.payload] };
    
    case 'UPDATE_PROPERTY':
      return {
        ...state,
        properties: state.properties.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
      };
    
    case 'SET_INSPECTIONS':
      return { ...state, inspections: action.payload };
    
    case 'ADD_INSPECTION':
      return { ...state, inspections: [...state.inspections, action.payload] };
    
    case 'UPDATE_INSPECTION':
      return {
        ...state,
        inspections: state.inspections.map(i => 
          i.id === action.payload.id ? action.payload : i
        ),
      };
    
    case 'ADD_ROOM':
      return { ...state, rooms: [...state.rooms, action.payload] };
    
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => 
          u.id === action.payload.id ? action.payload : u
        ),
      };
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload),
      };
    
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(i => 
          i.id === action.payload.id ? action.payload : i
        ),
      };
    
    case 'SET_PROCESSED_BILLING_PERIODS':
      return { ...state, processedBillingPeriods: action.payload };
    
    case 'ADD_PROCESSED_BILLING_PERIOD':
      return { 
        ...state, 
        processedBillingPeriods: [...state.processedBillingPeriods, action.payload] 
      };
    
    case 'SET_PROCESSED_AGENT_CASHBACKS':
      return { ...state, processedAgentCashbacks: action.payload };
    
    case 'ADD_PROCESSED_AGENT_CASHBACKS':
      return { 
        ...state, 
        processedAgentCashbacks: [...state.processedAgentCashbacks, ...action.payload] 
      };
    
    case 'SET_PRICING_SETTINGS':
      return { ...state, pricingSettings: action.payload };
    
    case 'UPDATE_PRICING':
      return {
        ...state,
        pricingSettings: state.pricingSettings.map(p => 
          p.inspectionType === action.payload.inspectionType ? action.payload : p
        ),
      };
    
    case 'SET_FINANCIAL_RECORDS':
      return { ...state, financialRecords: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGOUT':
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      return { 
        ...initialState,
        pricingSettings: state.pricingSettings, // Keep pricing settings
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Set up global auth error handler
  useEffect(() => {
    const handleGlobalAuthError = () => {
      console.log('🔄 Global auth error handler triggered');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      dispatch({ type: 'LOGOUT' });
      apiClient.setAccessToken(null);
    };

    apiClient.setAuthErrorHandler(handleGlobalAuthError);
  }, []);

  // Validate session on app start
  useEffect(() => {
    const validateSession = async () => {
      const savedUser = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('accessToken');
      
      if (savedUser && savedToken) {
        try {
          const user = JSON.parse(savedUser);
          
          // Set the token first so we can test it
          apiClient.setAccessToken(savedToken);
          
          // Test the token by validating the session
          try {
            const validationResponse = await apiClient.validateSession();
            
            if (validationResponse.valid) {
              // Token is valid, use the updated user data from server
              const serverUser = validationResponse.user || user;
              dispatch({ type: 'SET_CURRENT_USER', payload: serverUser });
              dispatch({ type: 'SET_ACCESS_TOKEN', payload: savedToken });
              
              console.log('✅ Session validated for user:', serverUser.name);
            } else {
              // Session is not valid according to server
              console.warn('❌ Session validation returned invalid');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('accessToken');
              apiClient.setAccessToken(null);
            }
          } catch (apiError: any) {
            console.error('❌ Session validation failed:', apiError);
            
            // Check if it's a JWT/authentication error
            if (apiError.message?.includes('Invalid JWT') || 
                apiError.message?.includes('401') || 
                apiError.message?.includes('Unauthorized') ||
                apiError.message?.includes('HTTP 401')) {
              console.log('🔄 JWT token invalid or expired, clearing session');
              // Clear invalid session silently
              localStorage.removeItem('currentUser');
              localStorage.removeItem('accessToken');
              apiClient.setAccessToken(null);
              dispatch({ type: 'LOGOUT' });
            } else {
              // For other errors, log but don't clear session immediately
              console.error('Non-auth error during validation:', apiError);
            }
          }
        } catch (error) {
          console.error('Error loading saved user:', error);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('accessToken');
          apiClient.setAccessToken(null);
        }
      }
    };
    
    validateSession();
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (state.currentUser && state.accessToken) {
      console.log('Loading app data for user:', state.currentUser.name, 'Role:', state.currentUser.role);
      loadAppData();
    }
  }, [state.currentUser, state.accessToken]);

  const loadAppData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const handleAuthError = (err: any) => {
        if (err.message?.includes('Unauthorized') || 
            err.message?.includes('401') || 
            err.message?.includes('Invalid JWT')) {
          console.error('Authentication error detected, clearing session...');
          // Clear invalid session
          localStorage.removeItem('currentUser');
          localStorage.removeItem('accessToken');
          dispatch({ type: 'LOGOUT' });
          apiClient.setAccessToken(null);
          throw new Error('Session expired. Please log in again.');
        }
        throw err;
      };
      
      // Load all data in parallel
      const [
        propertiesResponse,
        inspectionsResponse,
        pricingResponse,
        invoicesResponse,
        financialResponse,
        usersResponse,
      ] = await Promise.all([
        apiClient.getProperties().catch(err => {
          console.error('Error loading properties:', err);
          if (err.message?.includes('Unauthorized')) {
            handleAuthError(err);
          }
          return { properties: [] };
        }),
        apiClient.getInspections().catch(err => {
          console.error('Error loading inspections:', err);
          if (err.message?.includes('Unauthorized')) {
            handleAuthError(err);
          }
          return { inspections: [] };
        }),
        apiClient.getPricingSettings().catch(err => {
          console.error('Error loading pricing:', err);
          if (err.message?.includes('Unauthorized')) {
            handleAuthError(err);
          }
          return { pricingSettings: [] };
        }),
        apiClient.getInvoices().catch(err => {
          console.error('Error loading invoices:', err);
          if (err.message?.includes('Unauthorized')) {
            handleAuthError(err);
          }
          return { invoices: [] };
        }),
        apiClient.getFinancialRecords().catch(err => {
          console.error('Error loading financial records:', err);
          if (err.message?.includes('Unauthorized')) {
            handleAuthError(err);
          }
          return { records: [] };
        }),
        state.currentUser?.role === 'admin' 
          ? apiClient.getUsers().catch(err => {
              console.error('Error loading users for admin:', err);
              if (err.message?.includes('Unauthorized')) {
                handleAuthError(err);
              }
              return { users: [] };
            })
          : Promise.resolve({ users: [] }),
      ]);

      dispatch({ type: 'SET_PROPERTIES', payload: propertiesResponse.properties });
      dispatch({ type: 'SET_INSPECTIONS', payload: inspectionsResponse.inspections });
      dispatch({ type: 'SET_PRICING_SETTINGS', payload: pricingResponse.pricingSettings });
      dispatch({ type: 'SET_INVOICES', payload: invoicesResponse.invoices });
      dispatch({ type: 'SET_FINANCIAL_RECORDS', payload: financialResponse.records });
      
      // Initialize processed billing periods (in real app, this would be loaded from backend)
      dispatch({ type: 'SET_PROCESSED_BILLING_PERIODS', payload: [] });
      
      if (state.currentUser?.role === 'admin') {
        console.log('Loading users for admin. Users received:', usersResponse.users?.length || 0);
        dispatch({ type: 'SET_USERS', payload: usersResponse.users });
      }
      
    } catch (error) {
      console.error('Error loading app data:', error);
      if (error instanceof Error && error.message.includes('Session expired')) {
        // Don't continue loading if session is invalid
        return;
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Export the default pricing for use by other components
export { DEFAULT_INSPECTION_PRICING };

// Helper function to get current pricing for an inspection type
export function getCurrentPricing(state: AppState, inspectionType: InspectionType): Record<number, number> {
  const pricingSetting = state.pricingSettings.find(p => p.inspectionType === inspectionType);
  return pricingSetting?.bedroomPricing || DEFAULT_INSPECTION_PRICING[inspectionType];
}

// Utility functions for data access
export function useAuth() {
  const { state, dispatch } = useApp();
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Attempting login for:', email);
      const response = await apiClient.signin({ email, password });
      
      if (response.user && response.accessToken) {
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('accessToken', response.accessToken);
        
        // Update state
        dispatch({ type: 'SET_CURRENT_USER', payload: response.user });
        dispatch({ type: 'SET_ACCESS_TOKEN', payload: response.accessToken });
        
        // Set API client token
        apiClient.setAccessToken(response.accessToken);
        
        console.log('Login successful for user:', response.user.name);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error so the UI can handle it properly
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await apiClient.signout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      apiClient.setAccessToken(null);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Attempting registration for:', userData.email);
      const response = await apiClient.signup({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        address: userData.address,
        role: userData.role,
      });
      
      if (response.user) {
        console.log('Registration successful for user:', response.user.name);
        return response.user;
      }
      
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    user: state.currentUser,
    isAuthenticated: !!state.currentUser && !!state.accessToken,
    isLoading: state.isLoading,
    login,
    logout,
    register,
  };
}

// Additional utility hooks
export function useProperties() {
  const { state, dispatch } = useApp();
  
  const addProperty = async (propertyData: Omit<Property, 'id' | 'createdAt' | 'agentId'>) => {
    try {
      const response = await apiClient.createProperty(propertyData);
      if (response.property) {
        dispatch({ type: 'ADD_PROPERTY', payload: response.property });
        return response.property;
      }
    } catch (error) {
      console.error('Error adding property:', error);
      throw error;
    }
  };
  
  return {
    properties: state.properties,
    addProperty,
  };
}

export function useInspections() {
  const { state, dispatch } = useApp();
  
  const addInspection = async (inspectionData: Omit<Inspection, 'id' | 'createdAt' | 'agentId' | 'status'>) => {
    try {
      const response = await apiClient.createInspection(inspectionData);
      if (response.inspection) {
        dispatch({ type: 'ADD_INSPECTION', payload: response.inspection });
        return response.inspection;
      }
    } catch (error) {
      console.error('Error adding inspection:', error);
      throw error;
    }
  };
  
  const updateInspection = async (id: string, updates: Partial<Inspection>) => {
    try {
      const response = await apiClient.updateInspection(id, updates);
      if (response.inspection) {
        dispatch({ type: 'UPDATE_INSPECTION', payload: response.inspection });
        return response.inspection;
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
      throw error;
    }
  };
  
  return {
    inspections: state.inspections,
    addInspection,
    updateInspection,
  };
}

export function useUsers() {
  const { state, dispatch } = useApp();
  
  const addUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
  }) => {
    try {
      console.log('Creating user via API:', userData.email, userData.role);
      const response = await apiClient.signup(userData);
      if (response.user) {
        console.log('User created successfully, adding to state:', response.user.email);
        dispatch({ type: 'ADD_USER', payload: response.user });
        return response.user;
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };
  
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const response = await apiClient.updateUser(id, updates);
      if (response.user) {
        dispatch({ type: 'UPDATE_USER', payload: response.user });
        return response.user;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };
  
  const deleteUser = async (id: string) => {
    try {
      await apiClient.deleteUser(id);
      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const reloadUsers = async () => {
    try {
      console.log('Manually reloading users...');
      const response = await apiClient.getUsers();
      console.log('Users reloaded:', response.users?.length || 0);
      dispatch({ type: 'SET_USERS', payload: response.users });
      return response.users;
    } catch (error) {
      console.error('Error reloading users:', error);
      throw error;
    }
  };

  const loadUser = async (userId: string) => {
    try {
      // Check if user is already in state
      const existingUser = state.users.find(u => u.id === userId);
      if (existingUser) {
        return existingUser;
      }

      console.log('Loading specific user:', userId);
      const response = await apiClient.getUser(userId);
      if (response.user) {
        // Add to state for future reference
        dispatch({ type: 'ADD_USER', payload: response.user });
        return response.user;
      }
    } catch (error) {
      console.error('Error loading user:', error);
      throw error;
    }
  };
  
  return {
    users: state.users,
    addUser,
    updateUser,
    deleteUser,
    reloadUsers,
    loadUser,
  };
}

export function useAdmin() {
  const { state, dispatch } = useApp();
  
  const clearAllProperties = async () => {
    try {
      console.log('Admin clearing all properties and related data...');
      const response = await apiClient.clearAllProperties();
      
      if (response.success) {
        // Clear the local state
        dispatch({ type: 'SET_PROPERTIES', payload: [] });
        dispatch({ type: 'SET_INSPECTIONS', payload: [] });
        dispatch({ type: 'SET_FINANCIAL_RECORDS', payload: [] });
        dispatch({ type: 'SET_INVOICES', payload: [] });
        
        console.log('✅ All properties and related data cleared successfully');
        console.log('Deleted counts:', response.deletedCounts);
        
        return response;
      }
    } catch (error) {
      console.error('Error clearing properties:', error);
      throw error;
    }
  };

  const removeUnauthorizedAdmin = async () => {
    try {
      console.log('Removing unauthorized admin user...');
      const response = await apiClient.removeUnauthorizedAdmin();
      
      if (response.success) {
        console.log('✅ Unauthorized admin user removed successfully');
        return response;
      }
    } catch (error) {
      console.error('Error removing unauthorized admin:', error);
      throw error;
    }
  };
  
  return {
    clearAllProperties,
    removeUnauthorizedAdmin,
  };
}