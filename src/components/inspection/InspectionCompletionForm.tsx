import React, { useState, useRef, useEffect } from 'react';
import { useApp, useInspections, useUsers } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
  FileText,
  Save,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Brain,
  Loader2
} from 'lucide-react';
import { Inspection, Room, User } from '../../types';
import { PhotoGallery } from './PhotoGallery';
import { InspectionReport } from './InspectionReport';
import { exportInspectionToHTML } from '../../utils/wordExport';
import { analyzePhoto, extractRoomType, getQuestionContext } from '../../utils/openaiService';
import { toast } from 'sonner';

interface InspectionCompletionFormProps {
  inspection: Inspection;
  onClose: () => void;
}

interface RoomData {
  name: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  notes: string;
  photos: string[];
}

interface FireSafetySection {
  id: string;
  title: string;
  items: {
    id: string;
    question: string;
    answer: 'yes' | 'no' | '';
    notes: string;
    photos: string[];
  }[];
}

export function InspectionCompletionForm({ inspection, onClose }: InspectionCompletionFormProps) {
  const { state } = useApp();
  const { updateInspection } = useInspections();
  const { loadUser } = useUsers();
  
  // Get property information for dynamic sections
  const property = state.properties.find(p => p.id === inspection.propertyId);
  const bedroomCount = property?.bedrooms || 0;
  // Assume at least 1 bathroom, but allow for more in larger properties (basic estimate)
  const bathroomCount = bedroomCount === 0 ? 1 : Math.max(1, Math.floor(bedroomCount / 2) + 1);

  // Helper function to generate bedroom sections
  const generateBedroomSections = (type: string, startingNumber: number) => {
    if (bedroomCount === 0) return []; // Studio has no bedrooms
    
    return Array.from({ length: bedroomCount }, (_, index) => {
      const bedroomNumber = index + 1;
      const sectionNumber = startingNumber + index;
      return {
        id: `bedroom_${bedroomNumber}_${type}`,
        title: `${sectionNumber}. Bedroom ${bedroomNumber}`,
        items: type === 'checkin' ? [
          { id: `bed${bedroomNumber}_walls_condition`, question: `Are the walls, paintwork, and ceilings in good condition?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_flooring_clean`, question: `Is the flooring/carpeting clean and in good condition?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_windows_secure`, question: `Do windows open/close securely and are clean?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_curtains_present`, question: `Are curtains/blinds present and in good condition?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_electrical_working`, question: `Are sockets, switches, and lights working?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_heating_working`, question: `Is radiator/heating unit working?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_furniture_present`, question: `If furnished, are all items present and in good condition?`, answer: '', notes: '', photos: [] },
        ] : type === 'checkout' ? [
          { id: `bed${bedroomNumber}_no_damage`, question: `Are walls, ceilings, and flooring free from new damage?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_windows_clean`, question: `Do windows open/close securely and are clean?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_curtains_intact`, question: `Are curtains/blinds present, clean, and intact?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_radiator_working`, question: `Is radiator/heating unit working?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_furniture_undamaged`, question: `If furnished, are all items present, clean, and undamaged?`, answer: '', notes: '', photos: [] },
        ] : [
          { id: `bed${bedroomNumber}_structure`, question: `Are walls, ceilings, and flooring in good condition?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_windows`, question: `Are windows secure and in good condition?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_heating`, question: `Are radiators/heating units working?`, answer: '', notes: '', photos: [] },
          { id: `bed${bedroomNumber}_furniture`, question: `Is furniture (if provided) undamaged and present?`, answer: '', notes: '', photos: [] },
        ]
      };
    });
  };

  // Helper function to generate bathroom sections
  const generateBathroomSections = (type: string, startingNumber: number) => {
    return Array.from({ length: bathroomCount }, (_, index) => {
      const bathroomNumber = index + 1;
      const sectionNumber = startingNumber + index;
      const title = bathroomCount === 1 ? `${sectionNumber}. Bathroom` : `${sectionNumber}. Bathroom ${bathroomNumber}`;
      
      return {
        id: `bathroom_${bathroomNumber}_${type}`,
        title,
        items: type === 'checkin' ? [
          { id: `bath${bathroomNumber}_sink_clean`, question: `Is the sink clean and taps working (no leaks)?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_toilet_working`, question: `Is the toilet flushing properly and in clean condition?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_bath_shower`, question: `Is the bath/shower working, with no leaks or mould build-up?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_sealant_intact`, question: `Is sealant/mastic intact and free from mould?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_tiles_clean`, question: `Are tiles, grout, and flooring clean and undamaged?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_extractor_working`, question: `Is the extractor fan working properly?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_mirrors_present`, question: `Are mirrors, shelves, cabinets present and in good condition?`, answer: '', notes: '', photos: [] },
        ] : type === 'checkout' ? [
          { id: `bath${bathroomNumber}_sink_clean_checkout`, question: `Is the sink clean, taps working, drains clear?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_toilet_clean_checkout`, question: `Is the toilet clean, flushing, and free from limescale/damage?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_bath_shower_checkout`, question: `Is the bath/shower clean, fully working, with no leaks?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_sealant_intact_checkout`, question: `Is sealant/mastic intact and free from mould?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_tiles_clean_checkout`, question: `Are tiles, grout, and flooring clean and undamaged?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_extractor_clean_checkout`, question: `Is the extractor fan clean and working?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_mirrors_clean_checkout`, question: `Are mirrors, shelves, cabinets intact and clean?`, answer: '', notes: '', photos: [] },
        ] : [
          { id: `bath${bathroomNumber}_sink`, question: `Is the sink clean and taps working (no leaks)?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_toilet_condition`, question: `Is the toilet flushing properly and in clean condition?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_bath_shower_routine`, question: `Is the bath/shower working, with no leaks or mould build-up?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_sealant_mastic`, question: `Is sealant/mastic intact and free from mould?`, answer: '', notes: '', photos: [] },
          { id: `bath${bathroomNumber}_extractor_fan`, question: `Is the extractor fan working properly?`, answer: '', notes: '', photos: [] },
        ]
      };
    });
  };

  const [formData, setFormData] = useState({
    overallNotes: '',
    recommendations: '',
    tenantPresent: '',
    inspectorName: '',
    tenantSignature: '',
    inspectorSignature: '',
  });
  const [rooms, setRooms] = useState<RoomData[]>([
    { name: 'Living Room', condition: 'good', notes: '', photos: [] },
    { name: 'Kitchen', condition: 'good', notes: '', photos: [] },
    { name: 'Bathroom', condition: 'good', notes: '', photos: [] },
  ]);
  
  // Additional rooms state
  const [additionalRooms, setAdditionalRooms] = useState<RoomData[]>([]);
  const [newRoomName, setNewRoomName] = useState('');

  // Additional rooms management functions
  const addAdditionalRoom = () => {
    if (newRoomName.trim()) {
      const newRoom: RoomData = {
        name: newRoomName.trim(),
        condition: 'good',
        notes: '',
        photos: []
      };
      setAdditionalRooms(prev => [...prev, newRoom]);
      setNewRoomName('');
    }
  };

  const removeAdditionalRoom = (index: number) => {
    setAdditionalRooms(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalRoom = (index: number, field: keyof RoomData, value: any) => {
    setAdditionalRooms(prev => prev.map((room, i) => 
      i === index ? { ...room, [field]: value } : room
    ));
  };

  const addPhotoToAdditionalRoom = (roomIndex: number, photo: string) => {
    setAdditionalRooms(prev => prev.map((room, i) => 
      i === roomIndex ? { ...room, photos: [...room.photos, photo] } : room
    ));
  };

  const removePhotoFromAdditionalRoom = (roomIndex: number, photoIndex: number) => {
    setAdditionalRooms(prev => prev.map((room, i) => 
      i === roomIndex 
        ? { ...room, photos: room.photos.filter((_, pi) => pi !== photoIndex) }
        : room
    ));
  };

  const handleAdditionalRoomPhotoUpload = async (roomIndex: number) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      if (files.length === 0) return;
      
      // Convert files to data URLs
      const filePromises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const dataUrls = await Promise.all(filePromises);
      
      // Add photos to the additional room
      dataUrls.forEach(photoUrl => {
        addPhotoToAdditionalRoom(roomIndex, photoUrl);
      });
      
      // Check if current user is a clerk for AI analysis
      const currentUser = state.currentUser;
      const shouldAnalyze = currentUser?.role === 'clerk' && dataUrls.length > 0;
      
      // Perform AI analysis if user is a clerk
      if (shouldAnalyze) {
        await analyzeAdditionalRoomPhotosWithAI(roomIndex, dataUrls);
      }
    };
    
    fileInput.click();
  };

  const analyzeAdditionalRoomPhotosWithAI = async (roomIndex: number, photoUrls: string[]) => {
    try {
      setIsAnalyzingPhoto(true);
      setAnalyzingPhotoInfo(`Analyzing ${photoUrls.length} photo(s) for additional room...`);
      
      // Get the room name for context
      const room = additionalRooms[roomIndex];
      if (!room) return;
      
      // Analyze the first photo (most representative)
      const firstPhoto = photoUrls[0];
      const roomType = room.name.toLowerCase();
      
      toast.info('🧠 AI is analyzing your photo...', {
        description: 'Generating room condition assessment'
      });
      
      const analysis = await analyzePhoto({
        imageBase64: firstPhoto,
        roomType,
        inspectionType: inspection.inspectionType as any,
        questionContext: `General condition assessment for ${room.name}`
      });
      
      // Update the notes field with AI analysis
      const aiGeneratedNotes = `AI Analysis: ${analysis.description}

Observations:
${analysis.observations.map(obs => `• ${obs}`).join('\n')}

${analysis.recommendations && analysis.recommendations.length > 0 ? 
`Recommendations:
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}` : ''}

---
Generated by AI on ${new Date().toLocaleString()}`;

      // Append to existing notes or replace if empty
      const currentNotes = room.notes;
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n\n${aiGeneratedNotes}`
        : aiGeneratedNotes;
      
      updateAdditionalRoom(roomIndex, 'notes', updatedNotes);
      
      toast.success('✅ AI analysis completed!', {
        description: `Condition assessed as: ${analysis.condition.toUpperCase()}`
      });
      
    } catch (error) {
      console.error('Error analyzing additional room photo with AI:', error);
      toast.error('AI analysis failed', {
        description: 'Please add notes manually'
      });
    } finally {
      setIsAnalyzingPhoto(false);
      setAnalyzingPhotoInfo('');
    }
  };
  
  // Check-in Inspection specific sections
  const getCheckinSections = (): FireSafetySection[] => {
    const baseSections: FireSafetySection[] = [
      {
        id: 'general_info_checkin',
        title: '1. General Information',
        items: [
          { id: 'meter_readings_recorded', question: 'Have meter readings been recorded (gas, electricity, water)?', answer: '', notes: '', photos: [] },
          { id: 'keys_provided', question: 'How many keys were provided to the tenant?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'property_front_entrance_checkin',
        title: '2. Property Front & Entrance',
        items: [
          { id: 'entrance_door_condition', question: 'Is the main entrance door in good condition (no new cracks, dents, or damage)?', answer: '', notes: '', photos: [] },
          { id: 'door_opens_closes_locks', question: 'Does the entrance door still open/close smoothly and lock securely?', answer: '', notes: '', photos: [] },
          { id: 'letterbox_knocker_bell', question: 'If fitted, is the letterbox, knocker, or bell intact and working (no damage since check-in)?', answer: '', notes: '', photos: [] },
          { id: 'door_frame_threshold', question: 'Is the external door frame and threshold undamaged (no new rot, gaps, or wear)?', answer: '', notes: '', photos: [] },
          { id: 'property_signage', question: 'Is the property number or signage still clearly visible and intact?', answer: '', notes: '', photos: [] },
          { id: 'front_step_pathway', question: 'Is the front step, pathway, or porch area clear, safe, and free of damage/obstructions?', answer: '', notes: '', photos: [] },
          { id: 'external_lighting', question: 'If external lighting is present, is it still working?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'entryway_hallways_checkin',
        title: '3. Entryway / Hallways',
        items: [
          { id: 'walls_free_damage', question: 'Are walls, paintwork, and ceilings free from damage/marks?', answer: '', notes: '', photos: [] },
          { id: 'flooring_clean_undamaged', question: 'Is flooring/carpeting clean and undamaged?', answer: '', notes: '', photos: [] },
          { id: 'light_fittings_working', question: 'Are all light fittings present and working?', answer: '', notes: '', photos: [] },
          { id: 'alarms_fitted_working', question: 'Are smoke/heat alarms fitted and working?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'living_rooms_checkin',
        title: '4. Living Room(s)',
        items: [
          { id: 'walls_good_condition', question: 'Are walls and ceilings in good condition?', answer: '', notes: '', photos: [] },
          { id: 'flooring_clean_damage_free', question: 'Is flooring clean and damage-free?', answer: '', notes: '', photos: [] },
          { id: 'windows_open_close_lock', question: 'Do windows open, close, and lock securely?', answer: '', notes: '', photos: [] },
          { id: 'curtains_clean_undamaged', question: 'Are curtains/blinds clean and undamaged?', answer: '', notes: '', photos: [] },
          { id: 'electrical_working_checkin', question: 'Are sockets, switches, and lights working?', answer: '', notes: '', photos: [] },
          { id: 'furniture_present_undamaged', question: 'If furnished, is each item present and undamaged?', answer: '', notes: '', photos: [] },
        ]
      }
    ];

    // Add dynamic bedroom sections
    const bedroomSections = generateBedroomSections('checkin', 5);
    baseSections.push(...bedroomSections);

    // Calculate the next section number after bedrooms
    const nextSectionNumber = 5 + bedroomSections.length;

    // Add kitchen section
    baseSections.push({
      id: 'kitchen_checkin',
      title: `${nextSectionNumber}. Kitchen`,
      items: [
        { id: 'worktops_clean_checkin', question: 'Are worktops, cupboards, and drawers clean and undamaged?', answer: '', notes: '', photos: [] },
        { id: 'sink_clean_working_checkin', question: 'Is the sink clean, taps working, and drains clear?', answer: '', notes: '', photos: [] },
        { id: 'appliances_clean_working_checkin', question: 'Are appliances (hob, oven, fridge/freezer, washing machine, extractor fan) clean and working?', answer: '', notes: '', photos: [] },
        { id: 'kitchen_flooring_clean_checkin', question: 'Is the flooring clean and damage-free?', answer: '', notes: '', photos: [] },
        { id: 'bin_provided_clean', question: 'Is a bin provided and clean?', answer: '', notes: '', photos: [] },
      ]
    });

    // Add dynamic bathroom sections
    const bathroomSections = generateBathroomSections('checkin', nextSectionNumber + 1);
    baseSections.push(...bathroomSections);

    // Calculate the next section number after bathrooms
    const finalSectionStart = nextSectionNumber + 1 + bathroomSections.length;

    // Add remaining sections
    baseSections.push(
      {
        id: 'outside_areas_checkin',
        title: `${finalSectionStart}. Outside Areas (if applicable)`,
        items: [
          { id: 'garden_tidy_rubbish_free', question: 'Is the garden/lawn tidy and rubbish-free?', answer: '', notes: '', photos: [] },
          { id: 'patios_safe_clean', question: 'Are patios/pathways safe and clean?', answer: '', notes: '', photos: [] },
          { id: 'sheds_present_good_condition', question: 'Are sheds/garages/bins present and in good condition?', answer: '', notes: '', photos: [] },
          { id: 'boundaries_intact_checkin', question: 'Are fences/gates/walls intact?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'safety_compliance_checkin',
        title: `${finalSectionStart + 1}. Safety & Compliance`,
        items: [
          { id: 'smoke_alarms_tested_checkin', question: 'Have smoke alarms been tested?', answer: '', notes: '', photos: [] },
          { id: 'co_alarm_fitted_working_checkin', question: 'Is a carbon monoxide alarm fitted (if required) and working?', answer: '', notes: '', photos: [] },
          { id: 'fire_doors_working_checkin', question: 'If HMO, are fire doors working and escape routes clear?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'final_confirmation_checkin',
        title: `${finalSectionStart + 2}. Final Confirmation`,
        items: [
          { id: 'photographs_taken', question: 'Have photographs been taken of all rooms and fixtures?', answer: '', notes: '', photos: [] },
          { id: 'inventory_cross_checked', question: 'Has the inventory been cross-checked and signed by tenant?', answer: '', notes: '', photos: [] },
          { id: 'copies_provided', question: 'Have copies been provided to both tenant and landlord/agent?', answer: '', notes: '', photos: [] },
        ]
      }
    );

    return baseSections;
  };

  // Checkout Inspection specific sections
  const getCheckoutSections = (): FireSafetySection[] => {
    const baseSections: FireSafetySection[] = [
      {
        id: 'general_info_checkout',
        title: '1. General Information',
        items: [
          { id: 'meter_readings', question: 'Have final meter readings been recorded (gas, electricity, water)?', answer: '', notes: '', photos: [] },
          { id: 'keys_returned', question: 'Have all keys been returned (number matches check-in)?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'property_front_entrance_checkout',
        title: '2. Property Front & Entrance',
        items: [
          { id: 'entrance_door_condition_checkout', question: 'Is the main entrance door in good condition (no new cracks, dents, or damage)?', answer: '', notes: '', photos: [] },
          { id: 'door_opens_closes_locks_checkout', question: 'Does the entrance door still open/close smoothly and lock securely?', answer: '', notes: '', photos: [] },
          { id: 'letterbox_knocker_bell_checkout', question: 'If fitted, is the letterbox, knocker, or bell intact and working (no damage since check-in)?', answer: '', notes: '', photos: [] },
          { id: 'door_frame_threshold_checkout', question: 'Is the external door frame and threshold undamaged (no new rot, gaps, or wear)?', answer: '', notes: '', photos: [] },
          { id: 'property_signage_checkout', question: 'Is the property number or signage still clearly visible and intact?', answer: '', notes: '', photos: [] },
          { id: 'front_step_pathway_checkout', question: 'Is the front step, pathway, or porch area clear, safe, and free of damage/obstructions?', answer: '', notes: '', photos: [] },
          { id: 'external_lighting_checkout', question: 'If external lighting is present, is it still working?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'entryway_hallways_checkout',
        title: '3. Entryway / Hallways',
        items: [
          { id: 'walls_same_condition', question: 'Are walls, paintwork, and ceilings in the same condition as check-in (no new marks/damage)?', answer: '', notes: '', photos: [] },
          { id: 'flooring_free_damage', question: 'Is flooring/carpeting free from stains, damage, or excessive wear?', answer: '', notes: '', photos: [] },
          { id: 'light_fittings_present', question: 'Are all light fittings present and working?', answer: '', notes: '', photos: [] },
          { id: 'alarms_fitted_functional', question: 'Are smoke/heat alarms still fitted and functional?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'living_rooms_checkout',
        title: '4. Living Room(s)',
        items: [
          { id: 'walls_no_new_damage', question: 'Are walls and ceilings free from new marks or damage since check-in?', answer: '', notes: '', photos: [] },
          { id: 'flooring_no_stains', question: 'Is flooring/carpet free from stains, burns, or damage?', answer: '', notes: '', photos: [] },
          { id: 'windows_secure_clean', question: 'Do windows open/close securely, glass intact, and clean?', answer: '', notes: '', photos: [] },
          { id: 'curtains_present_clean', question: 'Are curtains/blinds present, clean, and undamaged?', answer: '', notes: '', photos: [] },
          { id: 'electrical_working_checkout', question: 'Are sockets, switches, and lights working?', answer: '', notes: '', photos: [] },
          { id: 'furniture_present_clean', question: 'If furnished, are all items present, clean, and undamaged?', answer: '', notes: '', photos: [] },
        ]
      }
    ];

    // Add dynamic bedroom sections
    const bedroomSections = generateBedroomSections('checkout', 5);
    baseSections.push(...bedroomSections);

    // Calculate the next section number after bedrooms
    const nextSectionNumber = 5 + bedroomSections.length;

    // Add kitchen section
    baseSections.push({
      id: 'kitchen_checkout',
      title: `${nextSectionNumber}. Kitchen`,
      items: [
        { id: 'worktops_clean_undamaged', question: 'Are worktops, cupboards, and drawers clean and undamaged?', answer: '', notes: '', photos: [] },
        { id: 'sink_clean_working', question: 'Is the sink clean, taps working, and drains free from blockages?', answer: '', notes: '', photos: [] },
        { id: 'appliances_clean_working', question: 'Are appliances (hob, oven, fridge/freezer, washing machine, extractor fan) clean inside/out and working?', answer: '', notes: '', photos: [] },
        { id: 'kitchen_flooring_clean', question: 'Is the flooring free from stains and damage?', answer: '', notes: '', photos: [] },
        { id: 'bins_empty_clean', question: 'Are bins empty and clean?', answer: '', notes: '', photos: [] },
      ]
    });

    // Add dynamic bathroom sections
    const bathroomSections = generateBathroomSections('checkout', nextSectionNumber + 1);
    baseSections.push(...bathroomSections);

    // Calculate the next section number after bathrooms
    const finalSectionStart = nextSectionNumber + 1 + bathroomSections.length;

    // Add remaining sections
    baseSections.push(
      {
        id: 'outside_areas_checkout',
        title: `${finalSectionStart}. Outside Areas (if applicable)`,
        items: [
          { id: 'garden_tidy_maintained', question: 'Is the garden/lawn tidy, rubbish-free, and maintained as at check-in?', answer: '', notes: '', photos: [] },
          { id: 'patios_clear_safe', question: 'Are patios/pathways clear and safe?', answer: '', notes: '', photos: [] },
          { id: 'sheds_empty_clean', question: 'Are sheds/garages/bins empty, clean, and in good condition?', answer: '', notes: '', photos: [] },
          { id: 'boundaries_intact', question: 'Are fences, gates, and boundary walls intact?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'safety_compliance_checkout',
        title: `${finalSectionStart + 1}. Safety & Compliance`,
        items: [
          { id: 'smoke_alarms_place_tested', question: 'Are smoke alarms still in place and tested?', answer: '', notes: '', photos: [] },
          { id: 'co_alarm_fitted_working', question: 'Is a carbon monoxide alarm fitted (if required) and working?', answer: '', notes: '', photos: [] },
          { id: 'fire_doors_escape_clear', question: 'If HMO, are fire doors intact and escape routes clear?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'final_confirmation_checkout',
        title: `${finalSectionStart + 2}. Final Confirmation`,
        items: [
          { id: 'property_cleaned_standard', question: 'Has the property been cleaned to the agreed standard (professional clean if required)?', answer: '', notes: '', photos: [] },
          { id: 'belongings_removed', question: "Are all tenant's belongings removed?", answer: '', notes: '', photos: [] },
          { id: 'inventory_compared', question: 'Has the inventory been compared with check-in and signed off?', answer: '', notes: '', photos: [] },
          { id: 'damages_recorded', question: 'Are any damages, repairs, or deposit deductions recorded?', answer: '', notes: '', photos: [] },
        ]
      }
    );

    return baseSections;
  };

  // Routine Inspection specific sections
  const getRoutineSections = (): FireSafetySection[] => {
    const baseSections: FireSafetySection[] = [
      {
        id: 'property_front_entrance_routine',
        title: '1. Property Front & Entrance',
        items: [
          { id: 'entrance_door_condition_routine', question: 'Is the main entrance door in good condition (no new cracks, dents, or damage)?', answer: '', notes: '', photos: [] },
          { id: 'door_opens_closes_locks_routine', question: 'Does the entrance door still open/close smoothly and lock securely?', answer: '', notes: '', photos: [] },
          { id: 'letterbox_knocker_bell_routine', question: 'If fitted, is the letterbox, knocker, or bell intact and working (no damage since check-in)?', answer: '', notes: '', photos: [] },
          { id: 'door_frame_threshold_routine', question: 'Is the external door frame and threshold undamaged (no new rot, gaps, or wear)?', answer: '', notes: '', photos: [] },
          { id: 'property_signage_routine', question: 'Is the property number or signage still clearly visible and intact?', answer: '', notes: '', photos: [] },
          { id: 'front_step_pathway_routine', question: 'Is the front step, pathway, or porch area clear, safe, and free of damage/obstructions?', answer: '', notes: '', photos: [] },
          { id: 'external_lighting_routine', question: 'If external lighting is present, is it still working?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'entryway_hallways',
        title: '2. Entryway / Hallways',
        items: [
          { id: 'walls_paintwork', question: 'Are walls, paintwork, and ceilings in good condition (no new marks/damage)?', answer: '', notes: '', photos: [] },
          { id: 'flooring_safe', question: 'Is flooring/carpeting clean and safe (no trip hazards)?', answer: '', notes: '', photos: [] },
          { id: 'alarms_fitted', question: 'Are smoke/heat alarms fitted and tested?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'living_rooms',
        title: '3. Living Room(s)',
        items: [
          { id: 'walls_ceilings_floors', question: 'Are walls, ceilings, and flooring free from major damage?', answer: '', notes: '', photos: [] },
          { id: 'windows_secure', question: 'Are windows secure, undamaged, and lockable?', answer: '', notes: '', photos: [] },
          { id: 'electrical_working', question: 'Are sockets, switches, and lights working?', answer: '', notes: '', photos: [] },
          { id: 'furniture_condition', question: 'Is furniture (if provided) in good condition?', answer: '', notes: '', photos: [] },
        ]
      }
    ];

    // Add dynamic bedroom sections
    const bedroomSections = generateBedroomSections('routine', 4);
    baseSections.push(...bedroomSections);

    // Calculate the next section number after bedrooms
    const nextSectionNumber = 4 + bedroomSections.length;

    // Add kitchen section
    baseSections.push({
      id: 'kitchen',
      title: `${nextSectionNumber}. Kitchen`,
      items: [
        { id: 'worktops_cupboards', question: 'Are worktops, cupboards, and drawers clean and undamaged?', answer: '', notes: '', photos: [] },
        { id: 'sink_taps', question: 'Are sink and taps working properly (no leaks or blockages)?', answer: '', notes: '', photos: [] },
        { id: 'appliances_working', question: 'Are appliances (hob, oven, fridge/freezer, washing machine, extractor fan) working and maintained?', answer: '', notes: '', photos: [] },
        { id: 'kitchen_flooring', question: 'Is the flooring safe and undamaged?', answer: '', notes: '', photos: [] },
        { id: 'kitchen_hygiene', question: 'Is the kitchen kept in a hygienic condition?', answer: '', notes: '', photos: [] },
      ]
    });

    // Add dynamic bathroom sections
    const bathroomSections = generateBathroomSections('routine', nextSectionNumber + 1);
    baseSections.push(...bathroomSections);

    // Calculate the next section number after bathrooms
    const finalSectionStart = nextSectionNumber + 1 + bathroomSections.length;

    // Add remaining sections
    baseSections.push(
      {
        id: 'outside_areas',
        title: `${finalSectionStart}. Outside Areas (if applicable)`,
        items: [
          { id: 'garden_maintained', question: 'Is the garden/lawn tidy and maintained by tenant (as per tenancy)?', answer: '', notes: '', photos: [] },
          { id: 'pathways_clear', question: 'Are pathways and patios clear of hazards?', answer: '', notes: '', photos: [] },
          { id: 'bins_managed', question: 'Are bins managed properly (not overflowing/blocked)?', answer: '', notes: '', photos: [] },
          { id: 'boundaries_good', question: 'Are fences, gates, and boundary walls in good order?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'safety_compliance',
        title: `${finalSectionStart + 1}. Safety & Compliance`,
        items: [
          { id: 'smoke_alarms_tested', question: 'Have smoke alarms been tested and are working?', answer: '', notes: '', photos: [] },
          { id: 'co_alarm_working', question: 'Is carbon monoxide alarm fitted (if required) and working?', answer: '', notes: '', photos: [] },
          { id: 'fire_doors_clear', question: 'If HMO, are fire doors working and escape routes clear?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'final_confirmation',
        title: `${finalSectionStart + 2}. Final Confirmation`,
        items: [
          { id: 'tenant_feedback', question: 'Has tenant feedback been gathered regarding any concerns?', answer: '', notes: '', photos: [] },
          { id: 'recommendations_made', question: 'Have recommendations been made for any improvements?', answer: '', notes: '', photos: [] },
          { id: 'report_to_be_sent', question: 'Will a copy of this report be sent to tenant and landlord/agent?', answer: '', notes: '', photos: [] },
        ]
      }
    );

    return baseSections;
  };

  // Fire Safety specific sections  
  const getFireSafetySections = (): FireSafetySection[] => {
    const baseSections: FireSafetySection[] = [
      {
        id: 'property_front_entrance_fire',
        title: '1. Property Front & Entrance',
        items: [
          { id: 'entrance_door_condition_fire', question: 'Is the main entrance door in good condition (no new cracks, dents, or damage)?', answer: '', notes: '', photos: [] },
          { id: 'door_opens_closes_locks_fire', question: 'Does the entrance door still open/close smoothly and lock securely?', answer: '', notes: '', photos: [] },
          { id: 'letterbox_knocker_bell_fire', question: 'If fitted, is the letterbox, knocker, or bell intact and working (no damage since check-in)?', answer: '', notes: '', photos: [] },
          { id: 'door_frame_threshold_fire', question: 'Is the external door frame and threshold undamaged (no new rot, gaps, or wear)?', answer: '', notes: '', photos: [] },
          { id: 'property_signage_fire', question: 'Is the property number or signage still clearly visible and intact?', answer: '', notes: '', photos: [] },
          { id: 'front_step_pathway_fire', question: 'Is the front step, pathway, or porch area clear, safe, and free of damage/obstructions?', answer: '', notes: '', photos: [] },
          { id: 'external_lighting_fire', question: 'If external lighting is present, is it still working?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'smoke_alarms',
        title: '2. Smoke Alarms',
        items: [
          { id: 'smoke_every_floor', question: 'Is a smoke alarm installed on every floor of the property?', answer: '', notes: '', photos: [] },
          { id: 'smoke_secure', question: 'Are smoke alarms securely fixed, not damaged/loose?', answer: '', notes: '', photos: [] },
          { id: 'smoke_tested', question: 'Were smoke alarms tested during inspection (sound & response)?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'heat_alarms',
        title: '3. Heat Alarms (Kitchen Areas)',
        items: [
          { id: 'heat_kitchen', question: 'Is a heat alarm installed in the kitchen (where required)?', answer: '', notes: '', photos: [] },
          { id: 'heat_tested', question: 'Has the heat alarm been tested and confirmed operational?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'co_alarms',
        title: '4. Carbon Monoxide Alarms',
        items: [
          { id: 'co_fitted', question: 'Is a CO alarm fitted near boilers, gas appliances, or fireplaces?', answer: '', notes: '', photos: [] },
          { id: 'co_tested', question: 'Has the CO alarm been tested and confirmed operational?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'fire_doors',
        title: '5. Fire Safety Doors',
        items: [
          { id: 'doors_installed', question: 'Are fire doors installed where required?', answer: '', notes: '', photos: [] },
          { id: 'doors_close', question: 'Do fire doors close fully on their own without obstruction?', answer: '', notes: '', photos: [] },
          { id: 'doors_seals', question: 'Are smoke seals and intumescent strips intact?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'windows_safety',
        title: '6. Windows & Safety',
        items: [
          { id: 'windows_operate', question: 'Do all windows open/close safely and securely?', answer: '', notes: '', photos: [] },
          { id: 'escape_windows', question: 'Are escape windows (if required) large enough and accessible?', answer: '', notes: '', photos: [] },
        ]
      },
      {
        id: 'window_restrictors',
        title: '7. Window Restrictors',
        items: [
          { id: 'restrictors_fitted', question: 'Are window restrictors fitted on upper floor windows where required?', answer: '', notes: '', photos: [] },
          { id: 'restrictors_limit', question: 'Do restrictors limit opening to 100 mm (10 cm) or less?', answer: '', notes: '', photos: [] },
          { id: 'restrictors_override', question: 'Can restrictors be easily overridden for emergency escape?', answer: '', notes: '', photos: [] },
        ]
      }
    ];

    return baseSections;
  };

  const [checkinInspectionSections, setCheckinInspectionSections] = useState<FireSafetySection[]>(getCheckinSections());
  const [checkoutInspectionSections, setCheckoutInspectionSections] = useState<FireSafetySection[]>(getCheckoutSections());
  const [routineInspectionSections, setRoutineInspectionSections] = useState<FireSafetySection[]>(getRoutineSections());
  const [fireSafetySections, setFireSafetySections] = useState<FireSafetySection[]>(getFireSafetySections());

  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [agent, setAgent] = useState<User | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [analyzingPhotoInfo, setAnalyzingPhotoInfo] = useState<string>('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Announce AI features availability for clerks
  useEffect(() => {
    if (state.currentUser?.role === 'clerk') {
      console.log('🧠 AI Photo Analysis available for clerk user');
      toast.info('🧠 AI Photo Analysis Active', {
        description: 'Upload photos to get automatic condition assessments',
        duration: 3000
      });
    }
  }, [state.currentUser?.role]);

  // Load agent data when component mounts
  useEffect(() => {
    const loadAgentData = async () => {
      if (!inspection.agentId) return;
      
      // Check if agent is already in state
      const existingAgent = state.users.find(u => u.id === inspection.agentId);
      if (existingAgent) {
        setAgent(existingAgent);
        return;
      }

      // Load agent from API
      setIsLoadingAgent(true);
      try {
        const agentData = await loadUser(inspection.agentId);
        setAgent(agentData);
      } catch (error) {
        console.error('Error loading agent data:', error);
      } finally {
        setIsLoadingAgent(false);
      }
    };

    loadAgentData();
  }, [inspection.agentId, state.users, loadUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoomChange = (index: number, field: keyof RoomData, value: any) => {
    setRooms(prev => prev.map((room, i) => 
      i === index ? { ...room, [field]: value } : room
    ));
  };

  const handleCheckinInspectionChange = (sectionId: string, itemId: string, field: 'answer' | 'notes' | 'photos', value: any) => {
    setCheckinInspectionSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item => 
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : section
    ));
  };

  const handleCheckoutInspectionChange = (sectionId: string, itemId: string, field: 'answer' | 'notes' | 'photos', value: any) => {
    setCheckoutInspectionSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item => 
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : section
    ));
  };

  const handleRoutineInspectionChange = (sectionId: string, itemId: string, field: 'answer' | 'notes' | 'photos', value: any) => {
    setRoutineInspectionSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item => 
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : section
    ));
  };

  const handleFireSafetyChange = (sectionId: string, itemId: string, field: 'answer' | 'notes' | 'photos', value: any) => {
    setFireSafetySections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item => 
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : section
    ));
  };

  const handlePhotoUpload = async (sectionId: string, itemId: string, inspectionType: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      if (files.length === 0) return;
      
      // Convert files to data URLs
      const filePromises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const dataUrls = await Promise.all(filePromises);
      
      // Check if current user is a clerk for AI analysis
      const currentUser = state.currentUser;
      const shouldAnalyze = currentUser?.role === 'clerk' && dataUrls.length > 0;
      
      // Add photos first
      const updatePhotos = (currentPhotos: string[]) => [...currentPhotos, ...dataUrls];
      
      if (inspectionType === 'check_in') {
        const currentPhotos = checkinInspectionSections
          .find(s => s.id === sectionId)
          ?.items.find(i => i.id === itemId)?.photos || [];
        
        const newPhotos = updatePhotos(currentPhotos);
        handleCheckinInspectionChange(sectionId, itemId, 'photos', newPhotos);
      } else if (inspectionType === 'check_out') {
        const currentPhotos = checkoutInspectionSections
          .find(s => s.id === sectionId)
          ?.items.find(i => i.id === itemId)?.photos || [];
        
        const newPhotos = updatePhotos(currentPhotos);
        handleCheckoutInspectionChange(sectionId, itemId, 'photos', newPhotos);
      } else if (inspectionType === 'routine') {
        const currentPhotos = routineInspectionSections
          .find(s => s.id === sectionId)
          ?.items.find(i => i.id === itemId)?.photos || [];
        
        const newPhotos = updatePhotos(currentPhotos);
        handleRoutineInspectionChange(sectionId, itemId, 'photos', newPhotos);
      } else if (inspectionType === 'fire_safety') {
        const currentPhotos = fireSafetySections
          .find(s => s.id === sectionId)
          ?.items.find(i => i.id === itemId)?.photos || [];
        
        const newPhotos = updatePhotos(currentPhotos);
        handleFireSafetyChange(sectionId, itemId, 'photos', newPhotos);
      }
      
      // Perform AI analysis if user is a clerk
      if (shouldAnalyze) {
        await analyzePhotosWithAI(sectionId, itemId, inspectionType, dataUrls);
      }
    };
    
    fileInput.click();
  };

  const analyzePhotosWithAI = async (sectionId: string, itemId: string, inspectionType: string, photoUrls: string[]) => {
    try {
      setIsAnalyzingPhoto(true);
      setAnalyzingPhotoInfo(`Analyzing ${photoUrls.length} photo(s) with AI...`);
      
      // Analyze the first photo (most representative)
      const firstPhoto = photoUrls[0];
      const roomType = extractRoomType(sectionId, itemId);
      const questionContext = getQuestionContext(itemId);
      
      toast.info('🧠 AI is analyzing your photo...', {
        description: 'Generating room condition assessment'
      });
      
      const analysis = await analyzePhoto({
        imageBase64: firstPhoto,
        roomType,
        inspectionType: inspectionType as any,
        questionContext
      });
      
      // Update the notes field with AI analysis
      const aiGeneratedNotes = `AI Analysis: ${analysis.description}

Observations:
${analysis.observations.map(obs => `• ${obs}`).join('\n')}

${analysis.recommendations && analysis.recommendations.length > 0 ? 
`Recommendations:
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}` : ''}

---
Generated by AI on ${new Date().toLocaleString()}`;

      // Update the notes for the specific item
      if (inspectionType === 'check_in') {
        handleCheckinInspectionChange(sectionId, itemId, 'notes', aiGeneratedNotes);
      } else if (inspectionType === 'check_out') {
        handleCheckoutInspectionChange(sectionId, itemId, 'notes', aiGeneratedNotes);
      } else if (inspectionType === 'routine') {
        handleRoutineInspectionChange(sectionId, itemId, 'notes', aiGeneratedNotes);
      } else if (inspectionType === 'fire_safety') {
        handleFireSafetyChange(sectionId, itemId, 'notes', aiGeneratedNotes);
      }
      
      toast.success('✅ AI analysis completed!', {
        description: `Condition assessed as: ${analysis.condition.toUpperCase()}`
      });
      
    } catch (error) {
      console.error('Error analyzing photo with AI:', error);
      toast.error('AI analysis failed', {
        description: 'Please add notes manually'
      });
    } finally {
      setIsAnalyzingPhoto(false);
      setAnalyzingPhotoInfo('');
    }
  };

  const removePhoto = (sectionId: string, itemId: string, photoIndex: number, inspectionType: string) => {
    if (inspectionType === 'check_in') {
      const currentPhotos = checkinInspectionSections
        .find(s => s.id === sectionId)
        ?.items.find(i => i.id === itemId)?.photos || [];
      
      const newPhotos = currentPhotos.filter((_, index) => index !== photoIndex);
      handleCheckinInspectionChange(sectionId, itemId, 'photos', newPhotos);
    } else if (inspectionType === 'check_out') {
      const currentPhotos = checkoutInspectionSections
        .find(s => s.id === sectionId)
        ?.items.find(i => i.id === itemId)?.photos || [];
      
      const newPhotos = currentPhotos.filter((_, index) => index !== photoIndex);
      handleCheckoutInspectionChange(sectionId, itemId, 'photos', newPhotos);
    } else if (inspectionType === 'routine') {
      const currentPhotos = routineInspectionSections
        .find(s => s.id === sectionId)
        ?.items.find(i => i.id === itemId)?.photos || [];
      
      const newPhotos = currentPhotos.filter((_, index) => index !== photoIndex);
      handleRoutineInspectionChange(sectionId, itemId, 'photos', newPhotos);
    } else if (inspectionType === 'fire_safety') {
      const currentPhotos = fireSafetySections
        .find(s => s.id === sectionId)
        ?.items.find(i => i.id === itemId)?.photos || [];
      
      const newPhotos = currentPhotos.filter((_, index) => index !== photoIndex);
      handleFireSafetyChange(sectionId, itemId, 'photos', newPhotos);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Update inspection to completed status
      await updateInspection(inspection.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        notes: formData.overallNotes || undefined,
      });

      // Generate and download the inspection report
      setIsGeneratingReport(true);
      
      try {
        const inspectionData = {
          sections: getSections(),
          formData
        };

        // Check if property and agent exist before generating report
        if (property && agent) {
          // Use the word export utility to generate the HTML report
          await exportInspectionToHTML(inspection, property, agent, inspectionData);
          console.log('Inspection report generated and downloaded successfully');
        } else {
          console.error('Error generating inspection report: Missing property or agent data', {
            propertyExists: !!property,
            agentExists: !!agent,
            agentId: inspection.agentId
          });
        }
      } catch (reportError) {
        console.error('Error generating inspection report:', reportError);
        // Don't stop the flow - inspection is still completed even if report generation fails
      } finally {
        setIsGeneratingReport(false);
      }
      
      setShowReport(true);
    } catch (error) {
      console.error('Error completing inspection:', error);
      // Handle error (could show a toast or alert)
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleBackToForm = () => {
    setShowReport(false);
  };

  // Agent data is now loaded via useEffect and stored in local state

  const getSections = () => {
    switch (inspection.inspectionType) {
      case 'check_in':
        return checkinInspectionSections;
      case 'check_out':
        return checkoutInspectionSections;
      case 'routine':
        return routineInspectionSections;
      case 'fire_safety':
        return fireSafetySections;
      default:
        return routineInspectionSections;
    }
  };

  const getChangeHandler = () => {
    switch (inspection.inspectionType) {
      case 'check_in':
        return handleCheckinInspectionChange;
      case 'check_out':
        return handleCheckoutInspectionChange;
      case 'routine':
        return handleRoutineInspectionChange;
      case 'fire_safety':
        return handleFireSafetyChange;
      default:
        return handleRoutineInspectionChange;
    }
  };

  const sections = getSections();
  const changeHandler = getChangeHandler();

  // Show report view if showReport is true
  if (showReport) {
    if (agent && property) {
      const inspectionData = {
        sections: getSections(),
        formData
      };

      return (
        <InspectionReport
          inspection={inspection}
          property={property}
          agent={agent}
          inspectionData={inspectionData}
          onBack={() => onClose()}
        />
      );
    }
  }

  // Show loading state if agent data is still being loaded
  if (isLoadingAgent || !agent) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inspection data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Complete {inspection.inspectionType.replace('_', '-').toUpperCase()} Inspection
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {property?.address || 'Loading address...'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {property?.bedrooms === 0 ? 'Studio' : `${property?.bedrooms} bed${property?.bedrooms > 1 ? 's' : ''}`}
          </Badge>
          <Badge variant="outline">
            {bathroomCount} bathroom{bathroomCount > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 min-h-0">
        <div className="max-w-4xl mx-auto">
          {/* Property Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Property Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Address</Label>
                <p className="text-gray-900">{property?.address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Property Type</Label>
                <p className="text-gray-900 capitalize">{property?.propertyType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Bedrooms</Label>
                <p className="text-gray-900">
                  {property?.bedrooms === 0 ? 'Studio (0 bedrooms)' : `${property?.bedrooms} bedroom${property?.bedrooms > 1 ? 's' : ''}`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Bathrooms (Estimated)</Label>
                <p className="text-gray-900">{bathroomCount} bathroom{bathroomCount > 1 ? 's' : ''}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Agent</Label>
                <p className="text-gray-900">{agent?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Inspection Date</Label>
                <p className="text-gray-900">{new Date(inspection.scheduledDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inspection Sections */}
          <div className="space-y-6">
            {inspection.inspectionType === 'check_in' && (
              <>
                {/* Check-in Inspection Sections */}
                {checkinInspectionSections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.items.map((item) => (
                        <div key={item.id} className="border-l-2 border-gray-100 pl-4">
                          <Label className="text-base font-medium text-gray-900 mb-3 block">
                            {item.question}
                          </Label>
                          
                          {/* Yes/No Radio Group */}
                          <RadioGroup
                            value={item.answer}
                            onValueChange={(value) => handleCheckinInspectionChange(section.id, item.id, 'answer', value)}
                            className="flex space-x-3 mb-3"
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="yes"
                                id={`${item.id}-yes`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'yes'}
                                onChange={(e) => handleCheckinInspectionChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-yes`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'yes' 
                                    ? 'bg-green-100 border-green-500 text-green-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className={`h-4 w-4 mr-2 ${item.answer === 'yes' ? 'text-green-600' : 'text-gray-400'}`} />
                                Yes
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="no"
                                id={`${item.id}-no`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'no'}
                                onChange={(e) => handleCheckinInspectionChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-no`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'no' 
                                    ? 'bg-red-100 border-red-500 text-red-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:bg-red-50'
                                }`}
                              >
                                <X className={`h-4 w-4 mr-2 ${item.answer === 'no' ? 'text-red-600' : 'text-gray-400'}`} />
                                No
                              </Label>
                            </div>
                          </RadioGroup>

                          {/* Notes */}
                          <div className="mb-3">
                            <Label htmlFor={`${item.id}-notes`} className="text-sm font-medium text-gray-600 mb-2 block">
                              Notes (optional)
                            </Label>
                            <Textarea
                              id={`${item.id}-notes`}
                              value={item.notes}
                              onChange={(e) => handleCheckinInspectionChange(section.id, item.id, 'notes', e.target.value)}
                              placeholder="Add any additional notes..."
                              className="min-h-[60px]"
                            />
                          </div>

                          {/* Photo Upload */}
                          <PhotoGallery
                            photos={item.photos}
                            onPhotoUpload={() => handlePhotoUpload(section.id, item.id, inspection.inspectionType)}
                            onPhotoRemove={(photoIndex) => removePhoto(section.id, item.id, photoIndex, inspection.inspectionType)}
                            isAnalyzing={isAnalyzingPhoto}
                            analyzingInfo={analyzingPhotoInfo}
                            showAIFeature={state.currentUser?.role === 'clerk'}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {inspection.inspectionType === 'check_out' && (
              <>
                {/* Checkout Inspection Sections */}
                {checkoutInspectionSections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.items.map((item) => (
                        <div key={item.id} className="border-l-2 border-gray-100 pl-4">
                          <Label className="text-base font-medium text-gray-900 mb-3 block">
                            {item.question}
                          </Label>
                          
                          <RadioGroup
                            value={item.answer}
                            onValueChange={(value) => handleCheckoutInspectionChange(section.id, item.id, 'answer', value)}
                            className="flex space-x-3 mb-3"
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="yes"
                                id={`${item.id}-yes`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'yes'}
                                onChange={(e) => handleCheckoutInspectionChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-yes`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'yes' 
                                    ? 'bg-green-100 border-green-500 text-green-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className={`h-4 w-4 mr-2 ${item.answer === 'yes' ? 'text-green-600' : 'text-gray-400'}`} />
                                Yes
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="no"
                                id={`${item.id}-no`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'no'}
                                onChange={(e) => handleCheckoutInspectionChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-no`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'no' 
                                    ? 'bg-red-100 border-red-500 text-red-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:bg-red-50'
                                }`}
                              >
                                <X className={`h-4 w-4 mr-2 ${item.answer === 'no' ? 'text-red-600' : 'text-gray-400'}`} />
                                No
                              </Label>
                            </div>
                          </RadioGroup>

                          <div className="mb-3">
                            <Label htmlFor={`${item.id}-notes`} className="text-sm font-medium text-gray-600 mb-2 block">
                              Notes (optional)
                            </Label>
                            <Textarea
                              id={`${item.id}-notes`}
                              value={item.notes}
                              onChange={(e) => handleCheckoutInspectionChange(section.id, item.id, 'notes', e.target.value)}
                              placeholder="Add any additional notes..."
                              className="min-h-[60px]"
                            />
                          </div>

                          <PhotoGallery
                            photos={item.photos}
                            onPhotoUpload={() => handlePhotoUpload(section.id, item.id, inspection.inspectionType)}
                            onPhotoRemove={(photoIndex) => removePhoto(section.id, item.id, photoIndex, inspection.inspectionType)}
                            isAnalyzing={isAnalyzingPhoto}
                            analyzingInfo={analyzingPhotoInfo}
                            showAIFeature={state.currentUser?.role === 'clerk'}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {inspection.inspectionType === 'routine' && (
              <>
                {/* Routine Inspection Sections */}
                {routineInspectionSections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.items.map((item) => (
                        <div key={item.id} className="border-l-2 border-gray-100 pl-4">
                          <Label className="text-base font-medium text-gray-900 mb-3 block">
                            {item.question}
                          </Label>
                          
                          <RadioGroup
                            value={item.answer}
                            onValueChange={(value) => handleRoutineInspectionChange(section.id, item.id, 'answer', value)}
                            className="flex space-x-3 mb-3"
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="yes"
                                id={`${item.id}-yes`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'yes'}
                                onChange={(e) => handleRoutineInspectionChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-yes`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'yes' 
                                    ? 'bg-green-100 border-green-500 text-green-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className={`h-4 w-4 mr-2 ${item.answer === 'yes' ? 'text-green-600' : 'text-gray-400'}`} />
                                Yes
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="no"
                                id={`${item.id}-no`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'no'}
                                onChange={(e) => handleRoutineInspectionChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-no`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'no' 
                                    ? 'bg-red-100 border-red-500 text-red-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:bg-red-50'
                                }`}
                              >
                                <X className={`h-4 w-4 mr-2 ${item.answer === 'no' ? 'text-red-600' : 'text-gray-400'}`} />
                                No
                              </Label>
                            </div>
                          </RadioGroup>

                          <div className="mb-3">
                            <Label htmlFor={`${item.id}-notes`} className="text-sm font-medium text-gray-600 mb-2 block">
                              Notes (optional)
                            </Label>
                            <Textarea
                              id={`${item.id}-notes`}
                              value={item.notes}
                              onChange={(e) => handleRoutineInspectionChange(section.id, item.id, 'notes', e.target.value)}
                              placeholder="Add any additional notes..."
                              className="min-h-[60px]"
                            />
                          </div>

                          <PhotoGallery
                            photos={item.photos}
                            onPhotoUpload={() => handlePhotoUpload(section.id, item.id, inspection.inspectionType)}
                            onPhotoRemove={(photoIndex) => removePhoto(section.id, item.id, photoIndex, inspection.inspectionType)}
                            isAnalyzing={isAnalyzingPhoto}
                            analyzingInfo={analyzingPhotoInfo}
                            showAIFeature={state.currentUser?.role === 'clerk'}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {inspection.inspectionType === 'fire_safety' && (
              <>
                {/* Fire Safety Sections */}
                {fireSafetySections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.items.map((item) => (
                        <div key={item.id} className="border-l-2 border-gray-100 pl-4">
                          <Label className="text-base font-medium text-gray-900 mb-3 block">
                            {item.question}
                          </Label>
                          
                          <RadioGroup
                            value={item.answer}
                            onValueChange={(value) => handleFireSafetyChange(section.id, item.id, 'answer', value)}
                            className="flex space-x-3 mb-3"
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="yes"
                                id={`${item.id}-yes`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'yes'}
                                onChange={(e) => handleFireSafetyChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-yes`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'yes' 
                                    ? 'bg-green-100 border-green-500 text-green-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle className={`h-4 w-4 mr-2 ${item.answer === 'yes' ? 'text-green-600' : 'text-gray-400'}`} />
                                Yes
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                value="no"
                                id={`${item.id}-no`}
                                name={`${item.id}-answer`}
                                checked={item.answer === 'no'}
                                onChange={(e) => handleFireSafetyChange(section.id, item.id, 'answer', e.target.value)}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${item.id}-no`} 
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium min-w-[80px] ${
                                  item.answer === 'no' 
                                    ? 'bg-red-100 border-red-500 text-red-800 shadow-md transform scale-105' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:bg-red-50'
                                }`}
                              >
                                <X className={`h-4 w-4 mr-2 ${item.answer === 'no' ? 'text-red-600' : 'text-gray-400'}`} />
                                No
                              </Label>
                            </div>
                          </RadioGroup>

                          <div className="mb-3">
                            <Label htmlFor={`${item.id}-notes`} className="text-sm font-medium text-gray-600 mb-2 block">
                              Notes (optional)
                            </Label>
                            <Textarea
                              id={`${item.id}-notes`}
                              value={item.notes}
                              onChange={(e) => handleFireSafetyChange(section.id, item.id, 'notes', e.target.value)}
                              placeholder="Add any additional notes..."
                              className="min-h-[60px]"
                            />
                          </div>

                          <PhotoGallery
                            photos={item.photos}
                            onPhotoUpload={() => handlePhotoUpload(section.id, item.id, inspection.inspectionType)}
                            onPhotoRemove={(photoIndex) => removePhoto(section.id, item.id, photoIndex, inspection.inspectionType)}
                            isAnalyzing={isAnalyzingPhoto}
                            analyzingInfo={analyzingPhotoInfo}
                            showAIFeature={state.currentUser?.role === 'clerk'}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Additional Rooms Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Additional Rooms</span>
                  <Badge variant="outline">{additionalRooms.length} added</Badge>
                </CardTitle>
                <CardDescription>
                  Add any additional rooms that need to be inspected (e.g., Study, Utility Room, Conservatory, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Room */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name (e.g., Study, Utility Room, Conservatory)"
                        onKeyPress={(e) => e.key === 'Enter' && addAdditionalRoom()}
                      />
                    </div>
                    <Button
                      onClick={addAdditionalRoom}
                      disabled={!newRoomName.trim()}
                      className="sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room
                    </Button>
                  </div>
                </div>

                {/* Display Additional Rooms */}
                {additionalRooms.length > 0 && (
                  <div className="space-y-4">
                    {additionalRooms.map((room, index) => (
                      <Card key={index} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAdditionalRoom(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Room Condition */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Overall Condition
                            </Label>
                            <RadioGroup
                              value={room.condition}
                              onValueChange={(value) => updateAdditionalRoom(index, 'condition', value as RoomData['condition'])}
                              className="flex flex-wrap gap-2"
                            >
                              {['excellent', 'good', 'fair', 'poor', 'damaged'].map((condition) => (
                                <div key={condition} className="flex items-center">
                                  <input
                                    type="radio"
                                    value={condition}
                                    id={`room-${index}-${condition}`}
                                    name={`room-${index}-condition`}
                                    checked={room.condition === condition}
                                    onChange={(e) => updateAdditionalRoom(index, 'condition', e.target.value as RoomData['condition'])}
                                    className="sr-only"
                                  />
                                  <Label 
                                    htmlFor={`room-${index}-${condition}`}
                                    className={`inline-flex items-center justify-center px-3 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 text-sm font-medium min-w-[80px] ${
                                      room.condition === condition
                                        ? condition === 'excellent' ? 'bg-green-100 border-green-500 text-green-800 shadow-md transform scale-105'
                                        : condition === 'good' ? 'bg-blue-100 border-blue-500 text-blue-800 shadow-md transform scale-105'
                                        : condition === 'fair' ? 'bg-yellow-100 border-yellow-500 text-yellow-800 shadow-md transform scale-105'
                                        : condition === 'poor' ? 'bg-orange-100 border-orange-500 text-orange-800 shadow-md transform scale-105'
                                        : 'bg-red-100 border-red-500 text-red-800 shadow-md transform scale-105'
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                  >
                                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          {/* Room Notes */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Notes
                            </Label>
                            <Textarea
                              value={room.notes}
                              onChange={(e) => updateAdditionalRoom(index, 'notes', e.target.value)}
                              placeholder="Add any specific notes about this room..."
                              className="min-h-[80px]"
                            />
                          </div>

                          {/* Room Photos */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Photos
                            </Label>
                            <PhotoGallery
                              photos={room.photos}
                              onPhotoUpload={() => handleAdditionalRoomPhotoUpload(index)}
                              onPhotoRemove={(photoIndex) => removePhotoFromAdditionalRoom(index, photoIndex)}
                              isAnalyzing={isAnalyzingPhoto}
                              analyzingInfo={analyzingPhotoInfo}
                              showAIFeature={state.currentUser?.role === 'clerk'}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {additionalRooms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No additional rooms added yet</p>
                    <p className="text-sm">Use the form above to add rooms that aren't covered in the standard inspection</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inspector Signature */}
            <Card>
              <CardHeader>
                <CardTitle>Inspector Signature & Final Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="inspectorName">Inspector Name</Label>
                  <Input
                    id="inspectorName"
                    value={formData.inspectorName}
                    onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                    placeholder="Enter inspector name"
                  />
                </div>
                <div>
                  <Label htmlFor="overallNotes">Overall Notes</Label>
                  <Textarea
                    id="overallNotes"
                    value={formData.overallNotes}
                    onChange={(e) => handleInputChange('overallNotes', e.target.value)}
                    placeholder="Add any overall notes about the inspection..."
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => handleInputChange('recommendations', e.target.value)}
                    placeholder="Add any recommendations..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isGeneratingReport}
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : isGeneratingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Complete & Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}