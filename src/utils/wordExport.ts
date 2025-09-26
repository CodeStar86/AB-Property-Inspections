import { Inspection, Property, User } from '../types';

interface InspectionData {
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      question: string;
      answer: 'yes' | 'no' | '';
      notes: string;
      photos: string[];
    }>;
  }>;
  formData: {
    overallNotes: string;
    recommendations: string;
    inspectorName: string;
  };
}

// Convert image URL to base64
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
}

export async function exportInspectionToHTML(
  inspection: Inspection,
  property: Property,
  agent: User,
  inspectionData: InspectionData
): Promise<void> {
  // Convert all images to base64
  const imagePromises: Promise<{ original: string; base64: string }>[] = [];
  
  inspectionData.sections.forEach(section => {
    section.items.forEach(item => {
      item.photos.forEach(photoUrl => {
        imagePromises.push(
          imageToBase64(photoUrl).then(base64 => ({
            original: photoUrl,
            base64
          }))
        );
      });
    });
  });

  const imageMap = new Map<string, string>();
  const resolvedImages = await Promise.all(imagePromises);
  resolvedImages.forEach(({ original, base64 }) => {
    if (base64) imageMap.set(original, base64);
  });

  // Generate the HTML content
  const htmlContent = generateHTMLDocument(inspection, property, agent, inspectionData, imageMap);
  
  // Create a blob with the HTML content
  const blob = new Blob([htmlContent], {
    type: 'text/html;charset=utf-8'
  });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const inspectionTypeLabel = getInspectionTypeLabel(inspection.inspectionType);
  const dateStr = new Date().toISOString().split('T')[0];
  const addressShort = property.address.split(',')[0].replace(/[^a-zA-Z0-9]/g, '_');
  
  link.download = `AB_Property_Inspection_${inspectionTypeLabel}_${addressShort}_${dateStr}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Legacy Word export function for compatibility
export function exportInspectionToWord(
  inspection: Inspection,
  property: Property,
  agent: User,
  inspectionData: InspectionData
): void {
  exportInspectionToHTML(inspection, property, agent, inspectionData);
}

function getInspectionTypeLabel(type: string): string {
  switch (type) {
    case 'check_in': return 'Check_In_Inspection';
    case 'check_out': return 'Check_Out_Inspection';
    case 'routine': return 'Routine_Inspection';
    case 'fire_safety': return 'Fire_Safety_Inspection';
    default: return type;
  }
}

function getInspectionDisplayLabel(type: string): string {
  switch (type) {
    case 'check_in': return 'Check-In Inspection';
    case 'check_out': return 'Check-Out Inspection';
    case 'routine': return 'Routine Inspection';
    case 'fire_safety': return 'Fire & Safety Inspection';
    default: return type;
  }
}

function generateHTMLDocument(
  inspection: Inspection,
  property: Property,
  agent: User,
  inspectionData: InspectionData,
  imageMap: Map<string, string>
): string {
  const bedroomCount = property.bedrooms;
  const bathroomCount = bedroomCount === 0 ? 1 : Math.max(1, Math.floor(bedroomCount / 2) + 1);

  // Calculate summary statistics
  const totalQuestions = inspectionData.sections.reduce((sum, section) => sum + section.items.length, 0);
  const answeredQuestions = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.filter(item => item.answer !== '').length, 0
  );
  const yesAnswers = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.filter(item => item.answer === 'yes').length, 0
  );
  const noAnswers = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.filter(item => item.answer === 'no').length, 0
  );
  const totalPhotos = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.reduce((itemSum, item) => itemSum + item.photos.length, 0), 0
  );

  // Create a complete HTML document that exactly matches the report view
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AB Property Inspection Report - ${getInspectionDisplayLabel(inspection.inspectionType)}</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #030213;
      background-color: #ffffff;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Header styles matching the app */
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .company-name {
      font-size: 2rem;
      font-weight: 600;
      color: #030213;
      margin-bottom: 0.5rem;
    }

    .report-title {
      font-size: 1.5rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .inspection-type {
      display: inline-block;
      font-size: 1.125rem;
      font-weight: 600;
      color: #030213;
      background-color: #f3f4f6;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .property-address {
      font-size: 1rem;
      color: #6b7280;
    }

    /* Card styles matching the app */
    .card {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1.5rem 0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #030213;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #030213;
    }

    /* Table styles */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    .info-table td {
      padding: 0.75rem 1rem 0.75rem 0;
      vertical-align: top;
      border-bottom: 1px solid #f3f4f6;
    }

    .info-label {
      font-weight: 600;
      width: 30%;
      color: #6b7280;
    }

    .info-value {
      color: #030213;
    }

    /* Summary stats */
    .summary-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat-item {
      text-align: center;
      padding: 1rem;
      background-color: #ffffff;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .stat-number.green { color: #059669; }
    .stat-number.red { color: #dc2626; }
    .stat-number.blue { color: #2563eb; }
    .stat-number.gray { color: #6b7280; }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    /* Section styles */
    .section {
      margin: 2rem 0;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #030213;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #030213;
    }

    /* Question items */
    .question-item {
      margin: 1.5rem 0;
      padding: 1rem;
      background-color: #f8fafc;
      border-left: 4px solid #e5e7eb;
      border-radius: 0 0.5rem 0.5rem 0;
    }

    .question-text {
      font-weight: 600;
      color: #030213;
      margin-bottom: 0.75rem;
    }

    .answer-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .answer-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .answer-yes {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .answer-no {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .answer-unanswered {
      background-color: #f3f4f6;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }

    .photos-info {
      color: #2563eb;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Photo gallery */
    .photo-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .photo-item {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      background-color: #f8fafc;
    }

    .photo-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }



    /* Notes section */
    .notes-section {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
    }

    .notes-label {
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
      display: block;
    }

    .notes-content {
      color: #334155;
      line-height: 1.6;
    }

    /* Inspector notes */
    .inspector-notes {
      background-color: #f8fafc;
      border: 2px solid #030213;
      border-radius: 0.75rem;
      padding: 2rem;
      margin: 2rem 0;
    }

    .inspector-notes h3 {
      color: #030213;
      margin-bottom: 1.5rem;
    }

    .overall-notes, .recommendations {
      margin: 1rem 0;
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .overall-notes {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
    }

    .recommendations {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    /* Warning notes */
    .warning-note {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }

    /* Footer */
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .footer p {
      margin: 0.5rem 0;
    }

    /* Print styles */
    @media print {
      @page {
        margin: 0.5in;
        size: A4;
        /* Hide browser headers and footers */
        @top-left { content: ""; }
        @top-center { content: ""; }
        @top-right { content: ""; }
        @bottom-left { content: ""; }
        @bottom-center { content: ""; }
        @bottom-right { content: ""; }
      }

      @page :first {
        @top-left { content: ""; }
        @top-center { content: ""; }
        @top-right { content: ""; }
        @bottom-left { content: ""; }
        @bottom-center { content: ""; }
        @bottom-right { content: ""; }
      }

      body {
        padding: 1rem;
        font-size: 12px;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .card, .section, .inspector-notes {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <div class="company-name">AB Property Inspection Services</div>
    <div class="report-title">Property Inspection Report</div>
    <div class="inspection-type">${getInspectionDisplayLabel(inspection.inspectionType)}</div>
    <div class="property-address">${property.address}</div>
  </div>

  <!-- Property Information Card -->
  <div class="card">
    <div class="card-title">Property Information</div>
    <table class="info-table">
      <tr>
        <td class="info-label">Address:</td>
        <td class="info-value">${property.address}</td>
      </tr>
      <tr>
        <td class="info-label">Property Type:</td>
        <td class="info-value">${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}</td>
      </tr>
      <tr>
        <td class="info-label">Bedrooms:</td>
        <td class="info-value">${property.bedrooms === 0 ? 'Studio (0 bedrooms)' : `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`}</td>
      </tr>
      <tr>
        <td class="info-label">Bathrooms (Estimated):</td>
        <td class="info-value">${bathroomCount} bathroom${bathroomCount > 1 ? 's' : ''}</td>
      </tr>
      <tr>
        <td class="info-label">Inspecting Agent:</td>
        <td class="info-value">${agent.name}</td>
      </tr>
      <tr>
        <td class="info-label">Inspector:</td>
        <td class="info-value">${inspectionData.formData.inspectorName || 'Not specified'}</td>
      </tr>
      <tr>
        <td class="info-label">Inspection Date:</td>
        <td class="info-value">${new Date(inspection.scheduledDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td class="info-label">Completion Date:</td>
        <td class="info-value">${inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : 'Not completed'}</td>
      </tr>
    </table>
  </div>

  <!-- Summary Statistics Card -->
  <div class="card summary-card">
    <div class="card-title">Inspection Summary</div>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number gray">${totalQuestions}</span>
        <span class="stat-label">Total Questions</span>
      </div>
      <div class="stat-item">
        <span class="stat-number green">${yesAnswers}</span>
        <span class="stat-label">Satisfactory</span>
      </div>
      <div class="stat-item">
        <span class="stat-number red">${noAnswers}</span>
        <span class="stat-label">Issues Found</span>
      </div>
      <div class="stat-item">
        <span class="stat-number blue">${totalPhotos}</span>
        <span class="stat-label">Photos Taken</span>
      </div>
    </div>
    ${answeredQuestions < totalQuestions ? `
      <div class="warning-note">
        <strong>⚠️ Note:</strong> ${totalQuestions - answeredQuestions} question${totalQuestions - answeredQuestions !== 1 ? 's' : ''} 
        ${totalQuestions - answeredQuestions !== 1 ? 'were' : 'was'} not answered.
      </div>
    ` : ''}
  </div>

  <div class="page-break"></div>

  <!-- Detailed Inspection Results -->
  <div class="card">
    <div class="card-title">Detailed Inspection Results</div>

    ${inspectionData.sections.map(section => `
      <div class="section">
        <div class="section-title">${section.title}</div>
        ${section.items.map(item => `
          <div class="question-item">
            <div class="question-text">${item.question}</div>
            <div class="answer-container">
              ${item.answer === 'yes' ? 
                '<span class="answer-badge answer-yes">✅ Yes</span>' : 
                item.answer === 'no' ? 
                  '<span class="answer-badge answer-no">❌ No</span>' : 
                  '<span class="answer-badge answer-unanswered">❓ Not Answered</span>'
              }
              ${item.photos.length > 0 ? 
                `<span class="photos-info">📸 ${item.photos.length} photo${item.photos.length !== 1 ? 's' : ''} attached</span>` : 
                ''
              }
            </div>
            ${item.notes ? `
              <div class="notes-section">
                <span class="notes-label">Notes:</span>
                <div class="notes-content">${item.notes}</div>
              </div>
            ` : ''}
            ${item.photos.length > 0 ? `
              <div class="photo-gallery">
                ${item.photos.map(photoUrl => {
                  const base64Image = imageMap.get(photoUrl);
                  return base64Image ? `
                    <div class="photo-item">
                      <img src="${base64Image}" alt="Inspection photo for: ${item.question}" />
                    </div>
                  ` : '';
                }).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>

  ${(inspectionData.formData.overallNotes || inspectionData.formData.recommendations) ? `
    <div class="page-break"></div>
    <div class="inspector-notes">
      <div class="card-title">Inspector Notes & Recommendations</div>
      ${inspectionData.formData.overallNotes ? `
        <div>
          <h4>📝 Overall Notes</h4>
          <div class="overall-notes">${inspectionData.formData.overallNotes}</div>
        </div>
      ` : ''}
      ${inspectionData.formData.recommendations ? `
        <div>
          <h4>💡 Recommendations</h4>
          <div class="recommendations">${inspectionData.formData.recommendations}</div>
        </div>
      ` : ''}
    </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <p><strong>This report was generated by AB Property Inspection Services</strong></p>
    <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>Inspector: ${inspectionData.formData.inspectorName || 'Not specified'}</p>
    <p style="margin-top: 1rem; font-style: italic;">This HTML report includes all inspection photos and can be printed to PDF or opened in Microsoft Word for editing.</p>
  </div>

</body>
</html>`;

  return htmlContent;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}