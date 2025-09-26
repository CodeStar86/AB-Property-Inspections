/**
 * Environment Variable Test Utility
 * Tests if environment variables are available in the current context
 */

export const testEnvironmentAccess = () => {
  const results = {
    hasImportMeta: false,
    hasImportMetaEnv: false,
    hasProcess: false,
    hasProcessEnv: false,
    viteVarsFound: 0,
    viteVarsList: [] as string[],
    supabaseUrlFound: false,
    supabaseKeyFound: false,
    context: 'unknown'
  };

  // Test import.meta availability with maximum safety
  try {
    if (typeof import.meta !== 'undefined') {
      results.hasImportMeta = true;
      
      try {
        if (import.meta && import.meta.env && typeof import.meta.env === 'object') {
          results.hasImportMetaEnv = true;
          
          // Count VITE_ variables safely
          try {
            const envObject = import.meta.env;
            if (envObject && typeof envObject === 'object') {
              const allKeys = Object.keys(envObject);
              const viteKeys = allKeys.filter(key => key.startsWith('VITE_'));
              results.viteVarsFound = viteKeys.length;
              results.viteVarsList = viteKeys;
              
              // Check specific variables
              results.supabaseUrlFound = !!(envObject.VITE_SUPABASE_URL);
              results.supabaseKeyFound = !!(envObject.VITE_SUPABASE_ANON_KEY);
            } else {
              console.warn('import.meta.env is not an object:', typeof envObject);
              results.viteVarsFound = 0;
              results.viteVarsList = [];
              results.supabaseUrlFound = false;
              results.supabaseKeyFound = false;
            }
          } catch (envError) {
            console.warn('Could not read import.meta.env properties:', envError);
            results.viteVarsFound = 0;
            results.viteVarsList = [];
            results.supabaseUrlFound = false;
            results.supabaseKeyFound = false;
          }
        } else {
          console.log('import.meta.env is not available or not an object');
        }
      } catch (metaError) {
        console.warn('Could not access import.meta.env:', metaError);
      }
    } else {
      console.log('import.meta is not available');
    }
  } catch (error) {
    console.warn('Could not access import at all:', error);
  }

  // Test process availability
  try {
    if (typeof process !== 'undefined') {
      results.hasProcess = true;
      if (process.env) {
        results.hasProcessEnv = true;
      }
    }
  } catch (error) {
    console.warn('Could not access process:', error);
  }

  // Determine context
  if (typeof window !== 'undefined') {
    results.context = 'browser';
  } else if (typeof global !== 'undefined') {
    results.context = 'node';
  } else {
    results.context = 'unknown';
  }

  return results;
};

export const logEnvironmentTest = () => {
  const results = testEnvironmentAccess();
  
  console.group('🧪 Environment Variable Access Test');
  console.log('Context:', results.context);
  console.log('import.meta available:', results.hasImportMeta ? '✅' : '❌');
  console.log('import.meta.env available:', results.hasImportMetaEnv ? '✅' : '❌');
  console.log('process available:', results.hasProcess ? '✅' : '❌');
  console.log('process.env available:', results.hasProcessEnv ? '✅' : '❌');
  console.log('VITE_ variables found:', results.viteVarsFound);
  console.log('VITE_ variables list:', results.viteVarsList);
  console.log('VITE_SUPABASE_URL found:', results.supabaseUrlFound ? '✅' : '❌');
  console.log('VITE_SUPABASE_ANON_KEY found:', results.supabaseKeyFound ? '✅' : '❌');
  console.groupEnd();
  
  return results;
};

export default testEnvironmentAccess;