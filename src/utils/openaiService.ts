/**
 * OpenAI Service for analyzing uploaded property inspection photos
 * Generates room condition descriptions based on visual analysis
 */

interface OpenAIAnalysisResponse {
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  description: string;
  observations: string[];
  recommendations?: string[];
}

interface AnalyzePhotoParams {
  imageBase64: string;
  roomType: string;
  inspectionType: 'check_in' | 'check_out' | 'routine' | 'fire_safety';
  questionContext?: string;
}

/**
 * Analyze a photo using OpenAI Vision API
 */
export async function analyzePhoto(params: AnalyzePhotoParams): Promise<OpenAIAnalysisResponse> {
  const { imageBase64, roomType, inspectionType, questionContext } = params;
  
  // Validate API key before making request
  const apiKeyResult = getOpenAIApiKey();
  if (!apiKeyResult.isValid || !apiKeyResult.key) {
    console.warn('🤖 OpenAI API not available:', apiKeyResult.error);
    
    // Return fallback response when API is not available
    return generateFallbackAnalysis(roomType, inspectionType);
  }

  try {
    // Prepare the context-aware prompt
    const prompt = generateAnalysisPrompt(roomType, inspectionType, questionContext);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyResult.key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model with vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'low' // Cost optimization while maintaining accuracy
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent, factual responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis content received from OpenAI');
    }

    // Parse the structured response
    return parseAnalysisResponse(analysisText);

  } catch (error) {
    console.error('Error analyzing photo with OpenAI:', error);
    
    // Return fallback response instead of throwing
    return {
      condition: 'good',
      description: 'AI analysis unavailable - please review photo manually',
      observations: ['Automatic analysis could not be completed'],
      recommendations: ['Manual inspection recommended']
    };
  }
}

/**
 * Generate context-aware prompt for photo analysis
 */
function generateAnalysisPrompt(roomType: string, inspectionType: string, questionContext?: string): string {
  const basePrompt = `You are a professional property inspector analyzing a photo for a ${inspectionType.replace('_', ' ')} inspection of a ${roomType}.

Please analyze this image and provide a structured assessment in the following JSON format:
{
  "condition": "excellent|good|fair|poor|damaged",
  "description": "Brief professional description of the room's condition",
  "observations": ["specific observation 1", "specific observation 2", "..."],
  "recommendations": ["recommendation 1", "recommendation 2", "..."]
}

Assessment criteria:
- EXCELLENT: Pristine condition, no visible issues
- GOOD: Minor wear appropriate for age, well-maintained
- FAIR: Some wear/minor issues that don't affect functionality
- POOR: Significant wear, multiple issues, needs attention
- DAMAGED: Visible damage requiring repair

Focus on:`;

  // Add inspection-type specific focus areas
  switch (inspectionType) {
    case 'check_in':
      return basePrompt + `
- Overall cleanliness and move-in readiness
- Any existing damage or wear
- Functionality of fixtures and fittings
- Safety compliance

${questionContext ? `Specific context: ${questionContext}` : ''}

Provide an objective assessment suitable for tenancy documentation.`;

    case 'check_out':
      return basePrompt + `
- Changes from original condition
- Tenant-related damage vs. normal wear
- Cleanliness standards
- Items requiring cleaning or repair

${questionContext ? `Specific context: ${questionContext}` : ''}

Focus on identifying damage beyond normal wear and tear.`;

    case 'routine':
      return basePrompt + `
- Ongoing maintenance needs
- Safety concerns
- General upkeep standards
- Potential issues developing

${questionContext ? `Specific context: ${questionContext}` : ''}

Identify maintenance requirements and safety issues.`;

    case 'fire_safety':
      return basePrompt + `
- Fire safety equipment condition
- Emergency exit accessibility
- Potential fire hazards
- Compliance with fire regulations

${questionContext ? `Specific context: ${questionContext}` : ''}

Prioritize safety compliance and hazard identification.`;

    default:
      return basePrompt + `
- General condition assessment
- Any visible issues or concerns
- Overall maintenance standards

${questionContext ? `Specific context: ${questionContext}` : ''}

Provide a comprehensive condition assessment.`;
  }
}

/**
 * Parse the AI response text into structured data
 */
function parseAnalysisResponse(responseText: string): OpenAIAnalysisResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields and structure
      return {
        condition: validateCondition(parsed.condition) || 'good',
        description: parsed.description || 'Analysis completed',
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : undefined
      };
    }
  } catch (error) {
    console.warn('Could not parse structured response, using fallback:', error);
  }

  // Fallback: extract information from plain text
  return {
    condition: extractConditionFromText(responseText),
    description: responseText.slice(0, 200) + (responseText.length > 200 ? '...' : ''),
    observations: [responseText],
    recommendations: []
  };
}

/**
 * Validate condition value
 */
function validateCondition(condition: string): 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null {
  const validConditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
  return validConditions.includes(condition?.toLowerCase()) 
    ? condition.toLowerCase() as any 
    : null;
}

/**
 * Extract condition from plain text response
 */
function extractConditionFromText(text: string): 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('excellent') || lowerText.includes('pristine')) return 'excellent';
  if (lowerText.includes('damaged') || lowerText.includes('damage')) return 'damaged';
  if (lowerText.includes('poor') || lowerText.includes('significant')) return 'poor';
  if (lowerText.includes('fair') || lowerText.includes('minor')) return 'fair';
  
  return 'good'; // Default fallback
}

/**
 * Validate and get OpenAI API key from environment variables
 * Follows the security pattern established in the project
 */
function getOpenAIApiKey(): { key: string | null; isValid: boolean; error?: string } {
  try {
    // Try to get API key safely without causing errors
    let apiKey: string | undefined;
    
    try {
      // Only access import.meta.env if it's available
      if (typeof import.meta !== 'undefined' && import.meta?.env) {
        apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      }
    } catch (envError) {
      // Environment variables not available
      return {
        key: null,
        isValid: false,
        error: 'Environment variables not accessible - OpenAI features disabled'
      };
    }
    
    // Check if API key is configured
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      return {
        key: null,
        isValid: false,
        error: 'OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.'
      };
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return {
        key: null,
        isValid: false,
        error: 'Invalid OpenAI API key format. Key should start with "sk-".'
      };
    }

    // Check key length (basic validation)
    if (apiKey.length < 50) {
      return {
        key: null,
        isValid: false,
        error: 'OpenAI API key appears to be incomplete.'
      };
    }

    // Key appears valid
    return {
      key: apiKey,
      isValid: true
    };
    
  } catch (error) {
    return {
      key: null,
      isValid: false,
      error: 'Could not access OpenAI configuration'
    };
  }
}

/**
 * Check if OpenAI service is available
 */
export function isOpenAIAvailable(): boolean {
  const { isValid } = getOpenAIApiKey();
  return isValid;
}

/**
 * Generate fallback analysis when OpenAI API is not available
 */
function generateFallbackAnalysis(roomType: string, inspectionType: string): OpenAIAnalysisResponse {
  const fallbackResponses = {
    'check_in': {
      condition: 'good' as const,
      description: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} appears to be in good condition for check-in inspection.`,
      observations: [
        'Photo uploaded successfully',
        'Manual inspection recommended',
        'AI analysis not available - OpenAI API key not configured'
      ],
      recommendations: [
        'Please conduct manual visual inspection',
        'Document any issues found during physical inspection',
        'Configure OpenAI API key to enable automated analysis'
      ]
    },
    'check_out': {
      condition: 'good' as const,
      description: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} condition documented for check-out inspection.`,
      observations: [
        'Photo uploaded successfully',
        'Manual review required',
        'AI analysis not available - OpenAI API key not configured'
      ],
      recommendations: [
        'Compare with check-in photos if available',
        'Note any changes or damage during manual inspection',
        'Configure OpenAI API key for automated condition analysis'
      ]
    },
    'routine': {
      condition: 'good' as const,
      description: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} documented for routine inspection.`,
      observations: [
        'Photo uploaded successfully',
        'Manual assessment needed',
        'AI analysis not available - OpenAI API key not configured'
      ],
      recommendations: [
        'Perform thorough manual inspection',
        'Check for maintenance requirements',
        'Configure OpenAI API key to enable AI-powered analysis'
      ]
    },
    'fire_safety': {
      condition: 'good' as const,
      description: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} fire safety elements documented.`,
      observations: [
        'Photo uploaded successfully',
        'Fire safety check required',
        'AI analysis not available - OpenAI API key not configured'
      ],
      recommendations: [
        'Verify fire safety equipment is present and functional',
        'Check smoke detector batteries if applicable',
        'Configure OpenAI API key for automated safety analysis'
      ]
    }
  };

  return fallbackResponses[inspectionType] || fallbackResponses['routine'];
}

/**
 * Extract room type from section and item context
 */
export function extractRoomType(sectionId: string, itemId: string): string {
  // Parse room type from section or item IDs
  if (sectionId.includes('bedroom')) return 'bedroom';
  if (sectionId.includes('bathroom') || sectionId.includes('bath')) return 'bathroom';
  if (sectionId.includes('kitchen')) return 'kitchen';
  if (sectionId.includes('living')) return 'living room';
  if (sectionId.includes('entryway') || sectionId.includes('hallway')) return 'hallway';
  if (sectionId.includes('outside') || sectionId.includes('garden')) return 'outdoor area';
  
  // Fallback to general room
  return 'room';
}

/**
 * Get question context from item ID for more targeted analysis
 */
export function getQuestionContext(itemId: string): string {
  // Extract context from common item ID patterns
  if (itemId.includes('walls')) return 'walls, paintwork, and surfaces';
  if (itemId.includes('flooring') || itemId.includes('carpet')) return 'flooring and carpeting';
  if (itemId.includes('windows')) return 'windows and glazing';
  if (itemId.includes('electrical') || itemId.includes('socket')) return 'electrical fixtures and outlets';
  if (itemId.includes('heating') || itemId.includes('radiator')) return 'heating systems and radiators';
  if (itemId.includes('furniture')) return 'furniture and fixtures';
  if (itemId.includes('sink') || itemId.includes('taps')) return 'plumbing and water fixtures';
  if (itemId.includes('toilet')) return 'toilet and sanitary facilities';
  if (itemId.includes('shower') || itemId.includes('bath')) return 'bathing facilities';
  if (itemId.includes('appliances')) return 'kitchen appliances and equipment';
  if (itemId.includes('safety') || itemId.includes('alarm')) return 'safety equipment and alarms';
  
  return 'general condition and maintenance';
}