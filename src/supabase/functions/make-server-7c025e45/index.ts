import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.ts';
import { 
  authRateLimit, 
  propertyRateLimit, 
  inspectionRateLimit, 
  financialRateLimit, 
  adminRateLimit,
  generalRateLimit,
  getClientIP,
  logSecurityEvent 
} from './rateLimiter.ts';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));

app.use('*', logger(console.log));

// Apply general rate limiting to all routes
app.use('/make-server-7c025e45/*', generalRateLimit);

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('🔧 Supabase configuration check:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('SUPABASE_URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'null');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize admin user
async function initializeAdmin() {
  try {
    // Get admin credentials from environment variables
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'r.depala86@gmail.com';
    const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'Bharti1956!';
    const adminName = Deno.env.get('ADMIN_NAME') || 'System Administrator';
    
    console.log('🔧 Admin configuration check:');
    console.log('ADMIN_EMAIL exists:', !!Deno.env.get('ADMIN_EMAIL'));
    console.log('ADMIN_PASSWORD exists:', !!Deno.env.get('ADMIN_PASSWORD'));
    console.log('Using admin email:', adminEmail);
    
    console.log('Initializing admin user:', adminEmail);
    
    // Check if admin user already exists in KV store
    const existingUsers = await kv.getByPrefix('user:');
    
    // Remove any unauthorized admin users
    const unauthorizedEmail = 'rahuldepala4ever@gmail.com';
    const unauthorizedUser = existingUsers.find(user => user.email === unauthorizedEmail);
    if (unauthorizedUser) {
      console.log('🚮 Removing unauthorized admin user:', unauthorizedEmail);
      await kv.del(`user:${unauthorizedUser.id}`);
      
      // Also try to remove from Supabase Auth
      try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const authUser = users?.users?.find(u => u.email === unauthorizedEmail);
        if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
          console.log('✅ Unauthorized user removed from Auth:', unauthorizedEmail);
        }
      } catch (cleanupError) {
        console.log('Could not remove unauthorized user from Auth:', cleanupError.message);
      }
    }
    
    const adminExists = existingUsers.find(user => 
      user.email === adminEmail && user.role === 'admin'
    );
    
    if (adminExists) {
      console.log('✅ Admin user already exists in KV store:', adminEmail);
      return;
    }
    
    console.log('Admin user not found in KV store, checking/creating in Supabase Auth...');
    
    // Try to find the user in Supabase Auth first
    let authUser = null;
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      authUser = users?.users?.find(u => u.email === adminEmail);
    } catch (listError) {
      console.log('Could not list users, will try to create:', listError.message);
    }
    
    if (authUser) {
      console.log('Found existing user in Auth, creating KV entry...');
      const adminData = {
        id: authUser.id,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        isActive: true,
        createdAt: authUser.created_at || new Date().toISOString()
      };
      await kv.set(`user:${authUser.id}`, adminData);
      console.log('✅ Admin user KV entry created for existing Auth user:', adminEmail);
      return;
    }
    
    // User doesn't exist in Auth, create new user
    console.log('Creating new admin user in Supabase Auth...');
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: { 
        name: adminName,
        role: 'admin' 
      },
      email_confirm: true
    });

    if (createError) {
      console.error('Error creating admin user in Auth:', createError.message);
      
      // Handle "already exists" error by trying to find the user again
      if (createError.message.includes('already been registered') || 
          createError.message.includes('already exists') ||
          createError.message.includes('User already registered')) {
        console.log('User already exists, attempting to find and create KV entry...');
        
        // Try again to find the user (sometimes the list doesn't immediately show new users)
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          const { data: retryUsers } = await supabase.auth.admin.listUsers();
          const existingUser = retryUsers?.users?.find(u => u.email === adminEmail);
          
          if (existingUser) {
            console.log('Found existing user on retry, creating KV entry...');
            const adminData = {
              id: existingUser.id,
              email: adminEmail,
              name: adminName,
              role: 'admin',
              isActive: true,
              createdAt: existingUser.created_at || new Date().toISOString()
            };
            await kv.set(`user:${existingUser.id}`, adminData);
            console.log('✅ Admin user recovered and KV entry created:', adminEmail);
            return;
          }
        } catch (recoveryError) {
          console.error('Error during user recovery:', recoveryError);
        }
      }
      
      console.error('Failed to create or recover admin user:', adminEmail);
      return;
    }

    // Successfully created new user, store in KV
    const adminData = {
      id: createData.user.id,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${createData.user.id}`, adminData);
    console.log('✅ New admin user created successfully:', adminEmail);
    
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

// Authentication Routes
app.post('/make-server-7c025e45/auth/signup', authRateLimit, async (c) => {
  try {
    const { email, password, name, role, phone, address } = await c.req.json();
    
    console.log('Creating new user:', { email, name, role, phone, address, hasPassword: !!password });
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Supabase Auth user creation error:', error.message);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ Supabase Auth user created successfully:', data.user.id);

    // Store additional user data in KV store
    const userData = {
      id: data.user.id,
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      firstLogin: true,
      phone: phone || undefined,
      address: address || undefined,
    };

    await kv.set(`user:${data.user.id}`, userData);
    console.log('✅ User data stored in KV store for:', email);
    
    return c.json({ user: userData });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.post('/make-server-7c025e45/auth/signin', authRateLimit, async (c) => {
  console.log('🚪 SIGNIN ENDPOINT HIT - this should appear in logs');
  try {
    console.log('📥 Signin request received');
    
    let requestData;
    try {
      requestData = await c.req.json();
      console.log('📦 Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return c.json({ error: 'Invalid request format' }, 400);
    }
    
    const { email, password } = requestData;
    console.log('🔐 Attempting to sign in user:', email);
    
    if (!email || !password) {
      console.error('❌ Missing email or password');
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // First check if it's the admin user and ensure admin is initialized
    if (email === 'r.depala86@gmail.com') {
      console.log('Admin user detected, ensuring initialization...');
      try {
        await initializeAdmin();
        console.log('Admin initialization check completed');
      } catch (initError) {
        console.error('Admin initialization error:', initError);
      }
    }
    
    console.log('🔗 Making Supabase auth call...');
    let authData, authError;
    try {
      const authResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      authData = authResult.data;
      authError = authResult.error;
      console.log('📡 Supabase auth call completed');
    } catch (authCallError) {
      console.error('❌ Supabase auth call threw exception:', authCallError);
      return c.json({ error: 'Authentication service error' }, 500);
    }

    if (authError) {
      console.error('❌ Supabase Auth signin error for', email, ':', authError.message);
      console.error('❌ Error details:', JSON.stringify(authError, null, 2));
      
      // Provide more specific error messages
      let userFriendlyError = authError.message;
      if (authError.message.includes('Invalid login credentials')) {
        userFriendlyError = 'Invalid email or password. Please check your credentials and try again.';
      } else if (authError.message.includes('Email not confirmed')) {
        userFriendlyError = 'Please confirm your email address before signing in.';
      } else if (authError.message.includes('Too many requests')) {
        userFriendlyError = 'Too many login attempts. Please wait a moment before trying again.';
      }
      
      return c.json({ error: userFriendlyError }, 400);
    }

    if (!authData?.user?.id) {
      console.error('❌ No user data returned from Supabase auth');
      return c.json({ error: 'Authentication failed - no user data' }, 400);
    }

    console.log('✅ Supabase Auth signin successful for:', email, 'User ID:', authData.user.id);

    // Get user data from KV store
    console.log('🗃️ Fetching user data from KV store...');
    let userData;
    try {
      userData = await kv.get(`user:${authData.user.id}`);
      console.log('📋 KV store fetch completed, userData exists:', !!userData);
    } catch (kvError) {
      console.error('❌ KV store fetch error:', kvError);
      return c.json({ error: 'Database error' }, 500);
    }
    
    if (!userData) {
      console.log('🆕 User not found in KV store, creating entry...');
      try {
        // Create user data if not exists (for existing auth users)
        const newUserData = {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: authData.user.user_metadata?.role || 'agent',
          isActive: true,
          createdAt: authData.user.created_at,
          firstLogin: false,
        };
        
        console.log('💾 Saving new user to KV store...');
        await kv.set(`user:${authData.user.id}`, newUserData);
        console.log('✅ New KV user entry created for:', email);
        
        return c.json({ 
          user: newUserData, 
          accessToken: authData.session?.access_token 
        });
      } catch (createError) {
        console.error('❌ Error creating new user in KV store:', createError);
        return c.json({ error: 'Failed to create user record' }, 500);
      }
    }
    
    console.log('✅ Returning existing user data for:', email);
    return c.json({ 
      user: userData, 
      accessToken: authData.session?.access_token 
    });
  } catch (error) {
    console.error('❌ General signin error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Return a more specific error if possible
    let errorMessage = 'Failed to sign in. Please try again.';
    if (error.message) {
      errorMessage += ` (${error.message})`;
    }
    
    return c.json({ error: errorMessage }, 500);
  }
});

app.post('/make-server-7c025e45/auth/signout', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (accessToken) {
      const { error } = await supabase.auth.admin.signOut(accessToken);
      if (error) {
        console.error('Signout error:', error.message);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    return c.json({ error: 'Failed to sign out' }, 500);
  }
});

// Protected route middleware
const requireAuth = async (c, next) => {
  console.log('🔒 requireAuth middleware called for:', c.req.url);
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  if (!accessToken) {
    console.error('❌ No access token provided for:', c.req.url);
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user?.id) {
    console.error('Auth verification error:', error?.message || 'No user found');
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Check if user exists in KV store, create if not
  try {
    let userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      console.log('User not found in KV store, creating entry for:', user.email);
      // Create user data if not exists (for existing auth users)
      userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'agent',
        isActive: true,
        createdAt: user.created_at,
        firstLogin: false,
      };
      await kv.set(`user:${user.id}`, userData);
      console.log('✅ KV user entry created for:', user.email);
    }
    
    // Store both user ID and user data for routes that need it
    c.set('userId', user.id);
    c.set('userData', userData);
  } catch (kvError) {
    console.error('Error checking/creating user in KV store:', kvError);
    return c.json({ error: 'Internal server error' }, 500);
  }
  
  await next();
};

// User Management Routes
app.get('/make-server-7c025e45/users', requireAuth, async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    return c.json({ users: users || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.get('/make-server-7c025e45/users/:id', requireAuth, async (c) => {
  try {
    const userId = c.req.param('id');
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

app.put('/make-server-7c025e45/users/:id', requireAuth, async (c) => {
  try {
    const userId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingUser = await kv.get(`user:${userId}`);
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const updatedUser = { ...existingUser, ...updates };
    await kv.set(`user:${userId}`, updatedUser);
    
    return c.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

app.delete('/make-server-7c025e45/users/:id', requireAuth, adminRateLimit, async (c) => {
  try {
    const userId = c.req.param('id');
    
    // Delete user data
    await kv.del(`user:${userId}`);
    
    // Delete user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Error deleting user from auth:', error.message);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Property Management Routes
app.get('/make-server-7c025e45/properties', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);
    
    let properties;
    if (currentUser?.role === 'admin') {
      // Admin can see all properties
      properties = await kv.getByPrefix('property:');
    } else if (currentUser?.role === 'agent') {
      // Agent can see only their properties
      const allProperties = await kv.getByPrefix('property:');
      properties = allProperties?.filter(p => p.agentId === userId) || [];
    } else {
      // Clerks can see all properties for inspections
      properties = await kv.getByPrefix('property:');
    }
    
    return c.json({ properties: properties || [] });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return c.json({ error: 'Failed to fetch properties' }, 500);
  }
});

app.post('/make-server-7c025e45/properties', requireAuth, propertyRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const propertyData = await c.req.json();
    
    const property = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...propertyData,
      agentId: userId,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`property:${property.id}`, property);
    
    return c.json({ property });
  } catch (error) {
    console.error('Error creating property:', error);
    return c.json({ error: 'Failed to create property' }, 500);
  }
});

// Inspection Management Routes
app.get('/make-server-7c025e45/inspections', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);
    
    let inspections;
    const allInspections = await kv.getByPrefix('inspection:');
    
    if (currentUser?.role === 'admin') {
      inspections = allInspections || [];
    } else if (currentUser?.role === 'agent') {
      inspections = allInspections?.filter(i => i.agentId === userId) || [];
    } else if (currentUser?.role === 'clerk') {
      inspections = allInspections?.filter(i => 
        i.clerkId === userId || i.status === 'scheduled'
      ) || [];
    } else {
      inspections = [];
    }
    
    return c.json({ inspections });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return c.json({ error: 'Failed to fetch inspections' }, 500);
  }
});

app.post('/make-server-7c025e45/inspections', requireAuth, inspectionRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const inspectionData = await c.req.json();
    
    const inspection = {
      id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...inspectionData,
      agentId: userId,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`inspection:${inspection.id}`, inspection);
    
    return c.json({ inspection });
  } catch (error) {
    console.error('Error creating inspection:', error);
    return c.json({ error: 'Failed to create inspection' }, 500);
  }
});

app.put('/make-server-7c025e45/inspections/:id', requireAuth, async (c) => {
  try {
    const inspectionId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingInspection = await kv.get(`inspection:${inspectionId}`);
    if (!existingInspection) {
      return c.json({ error: 'Inspection not found' }, 404);
    }
    
    const updatedInspection = { 
      ...existingInspection, 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`inspection:${inspectionId}`, updatedInspection);
    
    return c.json({ inspection: updatedInspection });
  } catch (error) {
    console.error('Error updating inspection:', error);
    return c.json({ error: 'Failed to update inspection' }, 500);
  }
});

// Financial Records Routes
app.get('/make-server-7c025e45/financial-records', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);
    
    let records;
    const allRecords = await kv.getByPrefix('financial:');
    
    if (currentUser?.role === 'admin') {
      records = allRecords || [];
    } else if (currentUser?.role === 'agent') {
      records = allRecords?.filter(r => r.agentId === userId) || [];
    } else if (currentUser?.role === 'clerk') {
      records = allRecords?.filter(r => r.clerkId === userId) || [];
    } else {
      records = [];
    }
    
    return c.json({ records });
  } catch (error) {
    console.error('Error fetching financial records:', error);
    return c.json({ error: 'Failed to fetch financial records' }, 500);
  }
});

// Pricing Settings Routes
app.get('/make-server-7c025e45/pricing', requireAuth, async (c) => {
  try {
    const pricingSettings = await kv.getByPrefix('pricing:');
    
    // Initialize default pricing if none exists
    if (!pricingSettings || pricingSettings.length === 0) {
      const defaultPricing = [
        {
          id: 'routine-pricing',
          inspectionType: 'routine',
          bedroomPricing: { 0: 50, 1: 75, 2: 100, 3: 125, 4: 150, 5: 175 },
          lastUpdated: new Date().toISOString(),
          updatedBy: c.get('userId'),
        },
        {
          id: 'fire-safety-pricing',
          inspectionType: 'fire_safety',
          bedroomPricing: { 0: 60, 1: 85, 2: 110, 3: 135, 4: 160, 5: 185 },
          lastUpdated: new Date().toISOString(),
          updatedBy: c.get('userId'),
        },
        {
          id: 'check-in-pricing',
          inspectionType: 'check_in',
          bedroomPricing: { 0: 80, 1: 105, 2: 130, 3: 155, 4: 180, 5: 205 },
          lastUpdated: new Date().toISOString(),
          updatedBy: c.get('userId'),
        },
        {
          id: 'check-out-pricing',
          inspectionType: 'check_out',
          bedroomPricing: { 0: 90, 1: 115, 2: 140, 3: 165, 4: 190, 5: 215 },
          lastUpdated: new Date().toISOString(),
          updatedBy: c.get('userId'),
        },
      ];
      
      for (const pricing of defaultPricing) {
        await kv.set(`pricing:${pricing.inspectionType}`, pricing);
      }
      
      return c.json({ pricingSettings: defaultPricing });
    }
    
    return c.json({ pricingSettings });
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    return c.json({ error: 'Failed to fetch pricing settings' }, 500);
  }
});

app.put('/make-server-7c025e45/pricing/:type', requireAuth, async (c) => {
  try {
    const inspectionType = c.req.param('type');
    const pricingData = await c.req.json();
    
    const pricing = {
      id: `${inspectionType}-pricing`,
      inspectionType,
      ...pricingData,
      lastUpdated: new Date().toISOString(),
      updatedBy: c.get('userId'),
    };
    
    await kv.set(`pricing:${inspectionType}`, pricing);
    
    return c.json({ pricing });
  } catch (error) {
    console.error('Error updating pricing:', error);
    return c.json({ error: 'Failed to update pricing' }, 500);
  }
});

// Invoice Management Routes
app.get('/make-server-7c025e45/invoices', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);
    
    let invoices;
    const allInvoices = await kv.getByPrefix('invoice:');
    
    if (currentUser?.role === 'admin') {
      invoices = allInvoices || [];
    } else if (currentUser?.role === 'agent') {
      invoices = allInvoices?.filter(i => i.agentId === userId) || [];
    } else if (currentUser?.role === 'clerk') {
      invoices = allInvoices?.filter(i => i.clerkId === userId) || [];
    } else {
      invoices = [];
    }
    
    return c.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

app.post('/make-server-7c025e45/invoices', requireAuth, financialRateLimit, async (c) => {
  try {
    const invoiceData = await c.req.json();
    
    const invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...invoiceData,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`invoice:${invoice.id}`, invoice);
    
    return c.json({ invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

// Admin Management Routes
app.delete('/make-server-7c025e45/admin/clear-properties', requireAuth, adminRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);
    
    // Only admin can clear all properties
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }
    
    console.log('Admin clearing all properties and related data...');
    
    // Get all properties and inspections to count them
    const allProperties = await kv.getByPrefix('property:');
    const allInspections = await kv.getByPrefix('inspection:');
    const allFinancialRecords = await kv.getByPrefix('financial:');
    const allInvoices = await kv.getByPrefix('invoice:');
    
    console.log(`Found ${allProperties?.length || 0} properties to delete`);
    console.log(`Found ${allInspections?.length || 0} inspections to delete`);
    console.log(`Found ${allFinancialRecords?.length || 0} financial records to delete`);
    console.log(`Found ${allInvoices?.length || 0} invoices to delete`);
    
    // Delete all properties
    if (allProperties && allProperties.length > 0) {
      const propertyKeys = allProperties.map(p => `property:${p.id}`);
      for (const key of propertyKeys) {
        await kv.del(key);
      }
    }
    
    // Delete all inspections
    if (allInspections && allInspections.length > 0) {
      const inspectionKeys = allInspections.map(i => `inspection:${i.id}`);
      for (const key of inspectionKeys) {
        await kv.del(key);
      }
    }
    
    // Delete all financial records
    if (allFinancialRecords && allFinancialRecords.length > 0) {
      const recordKeys = allFinancialRecords.map(r => `financial:${r.id}`);
      for (const key of recordKeys) {
        await kv.del(key);
      }
    }
    
    // Delete all invoices
    if (allInvoices && allInvoices.length > 0) {
      const invoiceKeys = allInvoices.map(i => `invoice:${i.id}`);
      for (const key of invoiceKeys) {
        await kv.del(key);
      }
    }
    
    const deletedCounts = {
      properties: allProperties?.length || 0,
      inspections: allInspections?.length || 0,
      financialRecords: allFinancialRecords?.length || 0,
      invoices: allInvoices?.length || 0,
    };
    
    console.log('✅ All data cleared successfully:', deletedCounts);
    
    return c.json({ 
      success: true, 
      message: 'All properties and related data cleared successfully',
      deletedCounts
    });
  } catch (error) {
    console.error('Error clearing properties:', error);
    return c.json({ error: 'Failed to clear properties' }, 500);
  }
});

app.post('/make-server-7c025e45/admin/remove-unauthorized', requireAuth, adminRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`user:${userId}`);
    
    // Only admin can remove unauthorized users
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }
    
    console.log('Removing unauthorized admin user...');
    
    const unauthorizedEmail = 'rahuldepala4ever@gmail.com';
    const users = await kv.getByPrefix('user:');
    const unauthorizedUser = users.find(user => user.email === unauthorizedEmail);
    
    if (unauthorizedUser) {
      await kv.del(`user:${unauthorizedUser.id}`);
      
      // Also try to remove from Supabase Auth
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === unauthorizedEmail);
        if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
          console.log('✅ Unauthorized user removed from Auth:', unauthorizedEmail);
        }
      } catch (cleanupError) {
        console.log('Could not remove unauthorized user from Auth:', cleanupError.message);
      }
      
      console.log('✅ Unauthorized admin user removed successfully');
      return c.json({ success: true, message: 'Unauthorized admin user removed' });
    } else {
      return c.json({ success: true, message: 'No unauthorized admin user found' });
    }
  } catch (error) {
    console.error('Error removing unauthorized admin:', error);
    return c.json({ error: 'Failed to remove unauthorized admin' }, 500);
  }
});

// Health check
app.get('/make-server-7c025e45/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AB Property Inspection Services API'
  });
});

// Session validation
app.get('/make-server-7c025e45/auth/validate', requireAuth, async (c) => {
  try {
    const userData = c.get('userData');
    return c.json({ 
      valid: true, 
      user: userData,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return c.json({ valid: false, timestamp: new Date().toISOString() }, 401);
  }
});

// Initialize admin on server startup
console.log('🚀 AB Property Inspection Services API starting...');
initializeAdmin().then(() => {
  console.log('✅ Admin initialization complete');
}).catch((error) => {
  console.error('❌ Admin initialization failed:', error);
});

// Serve the function
Deno.serve(app.fetch);